use crate::scripts::loader::js_runtime::{transpile_extension, SnipModuleLoader};
use crate::scripts::loader::scripts::{
    Command, EditorSelectionReplacement, EditorSelectionState, EditorState, Library, ScriptManager,
};
use crate::window::{WindowTask, Windows};
use deno_core::error::AnyError;
use deno_core::{
    extension, op2, v8, ByteString, JsRuntime, OpState, Resource, ResourceId, RuntimeOptions,
};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use tauri::ipc::Channel;
use tauri::State;
use tokio::sync::mpsc::channel;
use tokio::sync::oneshot::Sender;
use tokio::sync::{mpsc, oneshot, Mutex};

#[derive(Serialize, Deserialize)]
pub struct SearchResultCommandInfo {
    id: String,
    title: String,
    description: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    command: SearchResultCommandInfo,
    score: isize,
    matched_indices: Vec<usize>,
}

#[tauri::command]
pub async fn get_script_commands(
    state: State<'_, Mutex<ScriptManager>>,
    search_term: &str,
) -> Result<Vec<SearchResult>, ()> {
    let state = &state.lock().await;
    let matching_commands = state.find_commands_by_title(search_term);

    let results = matching_commands
        .iter()
        .map(|matching_command| SearchResult {
            score: matching_command.score,
            matched_indices: matching_command.matched_indices.clone(),
            command: SearchResultCommandInfo {
                id: matching_command.command.id.clone(),
                title: matching_command.command.info.title.clone(),
                description: matching_command.command.info.description.clone(),
            },
        })
        .collect();
    Ok(results)
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Script<'a> {
    id: &'a str,
    title: &'a str,
    description: &'a str,
    location: &'a str,
}

#[derive(Clone, Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum ScriptRunEditorRequestEvent {
    #[serde(rename_all = "camelCase")]
    GetFullText,
    #[serde(rename_all = "camelCase")]
    SetFullText(String),
    #[serde(rename_all = "camelCase")]
    SetError(String),
    #[serde(rename_all = "camelCase")]
    GetPartialText {
        start: Option<usize>,
        end: Option<usize>,
        selection_index: Option<usize>,
    },
    #[serde(rename_all = "camelCase")]
    ReplaceSelections(Vec<EditorSelectionReplacement>),
}

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct ScriptRunEditorRequest {
    id: Option<u64>,
    #[serde(flatten)]
    event: ScriptRunEditorRequestEvent,
}

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct ScriptRunEditorResponse {
    id: u64,
    error: Option<String>,
    #[serde(flatten)]
    event: Option<InternalScriptRunEditorResponse>,
}

#[derive(Clone, Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum InternalScriptRunEditorResponse {
    #[serde(rename_all = "camelCase")]
    GetFullText(String),
    GetPartialText(String),
}

#[derive(Debug)]
pub enum InternalScriptRunEditorRequest {
    Request(ScriptRunEditorRequestEvent),
    RequestWithResponse {
        event: ScriptRunEditorRequestEvent,
        reply_sender: Sender<Result<InternalScriptRunEditorResponse, String>>,
    },
    Error(String),
}

#[derive(Default)]
pub struct WindowScriptState {
    reply_senders: HashMap<u64, Sender<Result<InternalScriptRunEditorResponse, String>>>,
    last_given_id: u64,
}

#[tauri::command]
pub async fn run_script_command(
    window_state: State<'_, Mutex<Windows>>,
    script_manager: State<'_, Mutex<ScriptManager>>,
    webview_window: tauri::WebviewWindow,
    command_id: String,
    editor_request_channel: Channel<ScriptRunEditorRequest>,
    editor_state: EditorState,
) -> Result<(), String> {
    let window_label = webview_window.label().to_string();

    let (sender, mut receiver) = channel::<InternalScriptRunEditorRequest>(1);

    let (command, libraries) = {
        let script_manager = &script_manager.lock().await;
        (
            script_manager
                .find_command_by_id(command_id.as_str())
                .cloned(),
            script_manager.get_libraries_snapshot(),
        )
    };

    if command.is_none() {
        return Err("Could not find command for given id".to_string());
    }

    {
        let window_state = &window_state.lock().await;
        window_state
            .queue_task(
                &window_label,
                WindowTask::Script(ScriptTask::RunCommand(
                    command.unwrap(),
                    libraries,
                    sender,
                    editor_state,
                )),
            )
            .await
            .map_err(|_| "Could not send run script task to executor".to_string())?;
    }

    while !receiver.is_closed() {
        let request = receiver.recv().await;
        if let Some(request) = request {
            let event = match request {
                InternalScriptRunEditorRequest::Request(event) => {
                    ScriptRunEditorRequest { id: None, event }
                }
                InternalScriptRunEditorRequest::RequestWithResponse {
                    event,
                    reply_sender,
                } => {
                    let state = &mut window_state.lock().await;
                    let script_state = state
                        .get_script_state(&window_label)
                        .expect("Window should have script state");
                    let id = script_state.last_given_id;
                    script_state.last_given_id = id + 1;
                    script_state.reply_senders.insert(id, reply_sender);
                    ScriptRunEditorRequest {
                        id: Some(id),
                        event,
                    }
                }
                InternalScriptRunEditorRequest::Error(e) => {
                    println!("Received error: {}", e);
                    return Err(e);
                }
            };
            editor_request_channel
                .send(event)
                .map_err(|_| "Could not send event to editor".to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn reply_editor_request(
    state: State<'_, Mutex<Windows>>,
    webview_window: tauri::WebviewWindow,
    reply: ScriptRunEditorResponse,
) -> Result<(), String> {
    let state = &mut state.lock().await;
    let script_state = state
        .get_script_state(webview_window.label())
        .expect("Window should have script state");

    let reply_sender = script_state.reply_senders.remove(&reply.id);
    if let Some(sender) = reply_sender {
        sender
            .send(
                reply.event.ok_or(
                    reply
                        .error
                        .unwrap_or("Received an empty response".to_string()),
                ),
            )
            .map_err(|_| "Could not send response".to_string())?;
        Ok(())
    } else {
        Err("No reply sender found for the given id".to_string())
    }
}

pub enum ScriptTask {
    RunCommand(
        Command,
        HashMap<String, Library>,
        mpsc::Sender<InternalScriptRunEditorRequest>,
        EditorState,
    ),
}

struct EditorHandle {
    editor_request_channel: mpsc::Sender<InternalScriptRunEditorRequest>,
    editor_state: EditorState,
}

impl Resource for EditorHandle {}

#[op2(async)]
#[string]
async fn snip_op_get_full_text(
    state: Rc<RefCell<OpState>>,
    editor_handle: u32,
) -> Result<String, AnyError> {
    let request_channel = {
        let editor_handle_result = state
            .borrow()
            .resource_table
            .get::<EditorHandle>(editor_handle);
        if let Ok(editor_handle) = &editor_handle_result {
            let channel = editor_handle.editor_request_channel.clone();
            Ok(channel)
        } else {
            Err(AnyError::msg("Invalid editor handle"))
        }
    }?;

    let (sender, receiver) = oneshot::channel::<Result<InternalScriptRunEditorResponse, String>>();
    let request = request_channel
        .send(InternalScriptRunEditorRequest::RequestWithResponse {
            event: ScriptRunEditorRequestEvent::GetFullText,
            reply_sender: sender,
        })
        .await;
    if let Err(err) = request {
        return Err(AnyError::msg(err.to_string()));
    }

    let response = receiver
        .await
        .map_err(|err| AnyError::msg(err.to_string()))?
        .map_err(AnyError::msg)?;
    if let InternalScriptRunEditorResponse::GetFullText(fulltext) = response {
        Ok(fulltext)
    } else {
        Err(AnyError::msg("Received incorrect response"))
    }
}

#[op2(async)]
async fn snip_op_set_full_text(
    state: Rc<RefCell<OpState>>,
    editor_handle: u32,
    #[string] full_text: String,
) -> Result<(), AnyError> {
    let request_channel = {
        let editor_handle_result = state
            .borrow()
            .resource_table
            .get::<EditorHandle>(editor_handle);
        if let Ok(editor_handle) = &editor_handle_result {
            let channel = editor_handle.editor_request_channel.clone();
            Ok(channel)
        } else {
            Err(AnyError::msg("Invalid editor handle"))
        }
    }?;

    let request = request_channel
        .send(InternalScriptRunEditorRequest::Request(
            ScriptRunEditorRequestEvent::SetFullText(full_text),
        ))
        .await;
    if let Err(err) = request {
        return Err(AnyError::msg(err.to_string()));
    }

    Ok(())
}

#[op2(async)]
async fn snip_op_set_error(
    state: Rc<RefCell<OpState>>,
    editor_handle: u32,
    #[string] error: String,
) -> Result<(), AnyError> {
    let request_channel = {
        let editor_handle_result = state
            .borrow()
            .resource_table
            .get::<EditorHandle>(editor_handle);
        if let Ok(editor_handle) = &editor_handle_result {
            let channel = editor_handle.editor_request_channel.clone();
            Ok(channel)
        } else {
            Err(AnyError::msg("Invalid editor handle"))
        }
    }?;

    let request = request_channel
        .send(InternalScriptRunEditorRequest::Request(
            ScriptRunEditorRequestEvent::SetError(error),
        ))
        .await;
    if let Err(err) = request {
        return Err(AnyError::msg(err.to_string()));
    }

    Ok(())
}

#[op2(async)]
#[string]
async fn snip_op_get_partial_text(
    state: Rc<RefCell<OpState>>,
    editor_handle: u32,
    #[bigint] start: usize,
    #[bigint] end: usize,
) -> Result<String, AnyError> {
    let request_channel = {
        let editor_handle_result = state
            .borrow()
            .resource_table
            .get::<EditorHandle>(editor_handle);
        if let Ok(editor_handle) = &editor_handle_result {
            let channel = editor_handle.editor_request_channel.clone();
            Ok(channel)
        } else {
            Err(AnyError::msg("Invalid editor handle"))
        }
    }?;

    let (sender, receiver) = oneshot::channel::<Result<InternalScriptRunEditorResponse, String>>();
    let request = request_channel
        .send(InternalScriptRunEditorRequest::RequestWithResponse {
            event: ScriptRunEditorRequestEvent::GetPartialText {
                start: Some(start),
                end: Some(end),
                selection_index: None,
            },
            reply_sender: sender,
        })
        .await;
    if let Err(err) = request {
        return Err(AnyError::msg(err.to_string()));
    }

    let response = receiver
        .await
        .map_err(|err| AnyError::msg(err.to_string()))?
        .map_err(AnyError::msg)?;
    if let InternalScriptRunEditorResponse::GetPartialText(partial_text) = response {
        Ok(partial_text)
    } else {
        Err(AnyError::msg("Received incorrect response"))
    }
}

#[op2(async)]
#[serde]
async fn snip_op_get_selection_state(
    state: Rc<RefCell<OpState>>,
    editor_handle: u32,
) -> Result<EditorSelectionState, AnyError> {
    let editor_handle_result = state
        .borrow()
        .resource_table
        .get::<EditorHandle>(editor_handle);
    if let Ok(editor_handle) = &editor_handle_result {
        Ok(editor_handle.editor_state.selection.clone())
    } else {
        Err(AnyError::msg("Invalid editor handle"))
    }
}

#[op2(async)]
async fn snip_op_replace_selections(
    state: Rc<RefCell<OpState>>,
    editor_handle: u32,
    #[serde] replacements: Vec<EditorSelectionReplacement>,
) -> Result<(), AnyError> {
    let request_channel = {
        let editor_handle_result = state
            .borrow()
            .resource_table
            .get::<EditorHandle>(editor_handle);
        if let Ok(editor_handle) = &editor_handle_result {
            let channel = editor_handle.editor_request_channel.clone();
            Ok(channel)
        } else {
            Err(AnyError::msg("Invalid editor handle"))
        }
    }?;

    let request = request_channel
        .send(InternalScriptRunEditorRequest::Request(
            ScriptRunEditorRequestEvent::ReplaceSelections(replacements),
        ))
        .await;
    if let Err(err) = request {
        return Err(AnyError::msg(err.to_string()));
    }

    Ok(())
}

#[op2]
#[serde]
fn op_base64_atob(#[serde] mut s: ByteString) -> Result<ByteString, AnyError> {
    let decoded_len = base64_simd::forgiving_decode_inplace(&mut s)
        .map_err(|_| AnyError::msg("Invalid base64"))?
        .len();
    s.truncate(decoded_len);
    Ok(s)
}

#[op2]
#[string]
fn op_base64_btoa(#[serde] s: ByteString) -> String {
    base64_simd::STANDARD.encode_to_string(s.as_ref())
}

extension!(
    snip,
    ops = [
        snip_op_get_full_text,
        snip_op_set_full_text,
        snip_op_set_error,
        snip_op_get_partial_text,
        snip_op_get_selection_state,
        snip_op_replace_selections,
        op_base64_atob,
        op_base64_btoa,
    ],
    esm_entry_point = "ext:snip/index.ts",
    esm = [dir "js_runtime/snip", "index.ts"]
);

fn install_editor_handle_id(
    js_runtime: &mut JsRuntime,
    editor_handle_resource_id: ResourceId,
) -> Result<(), String> {
    let mut scope = js_runtime.handle_scope();
    let global = scope.get_current_context().global(&mut scope);
    let internals_key = v8::String::new(&mut scope, "_snipInternals")
        .ok_or("Could not allocate string: _snipInternals")?;
    let editor_handle_key = v8::String::new(&mut scope, "editorHandle")
        .ok_or("Could not allocate string: editorHandle")?;

    let internals_obj = v8::Object::new(&mut scope);

    let editor_handle = v8::Integer::new_from_unsigned(&mut scope, editor_handle_resource_id);
    internals_obj
        .set(&mut scope, editor_handle_key.into(), editor_handle.into())
        .ok_or("Could not set _snipInternals.editorHandle")?;
    global
        .set(&mut scope, internals_key.into(), internals_obj.into())
        .ok_or("Could not set _snipInternals")?;
    Ok(())
}

async fn load_and_run_module(js_runtime: &mut JsRuntime, command: Command) -> Result<(), String> {
    let module = command
        .get_deno_module_specifier()
        .map_err(|e| format!("Invalid module: {}", e))?;
    let module_id = js_runtime
        .load_main_es_module(&module)
        .await
        .map_err(|e| format!("Could not load module: {}", e))?;

    let result = js_runtime.mod_evaluate(module_id);
    js_runtime
        .run_event_loop(Default::default())
        .await
        .map_err(|e| format!("Uncaught error: {}", e))?;

    result.await.map_err(|e| format!("Uncaught error: {}", e))?;

    let namespace = js_runtime
        .get_module_namespace(module_id)
        .map_err(|e| format!("Uncaught error: {}", e))?;
    {
        let mut scope = js_runtime.handle_scope();
        let namespace = v8::Local::new(&mut scope, namespace);
        let default = v8::String::new(&mut scope, "default").unwrap();
        let default_export = namespace.get(&mut scope, default.into()).unwrap();
        if !default_export.is_function() {
            return Err("Module should contain a function as default export".to_string());
        }
        let default_export = v8::Local::<v8::Function>::try_from(default_export).unwrap();
        default_export
            .call(&mut scope, namespace.into(), &[])
            .unwrap();
    }

    js_runtime
        .run_event_loop(Default::default())
        .await
        .map_err(|e| format!("Uncaught error: {}", e))
}

pub async fn handle_script_run(
    command: Command,
    libraries: HashMap<String, Library>,
    editor_request_channel: mpsc::Sender<InternalScriptRunEditorRequest>,
    editor_state: EditorState,
) {
    let mut js_runtime = JsRuntime::new(RuntimeOptions {
        module_loader: Some(Rc::new(SnipModuleLoader::new(
            command.get_location(),
            libraries,
        ))),
        extension_transpiler: Some(Rc::new(transpile_extension)),
        extensions: vec![snip::init_ops_and_esm()],
        ..Default::default()
    });
    let editor_handle_resource_id =
        js_runtime
            .op_state()
            .borrow_mut()
            .resource_table
            .add(EditorHandle {
                editor_request_channel: editor_request_channel.clone(),
                editor_state,
            });

    let result = install_editor_handle_id(&mut js_runtime, editor_handle_resource_id);
    if result.is_err() {
        editor_request_channel
            .send(InternalScriptRunEditorRequest::Error(result.unwrap_err()))
            .await
            .expect("Could not send error back to tauri");
        return;
    }
    let result = load_and_run_module(&mut js_runtime, command).await;
    if result.is_err() {
        editor_request_channel
            .send(InternalScriptRunEditorRequest::Error(result.unwrap_err()))
            .await
            .expect("Could not send error back to tauri");
    }
}

pub async fn handle_script_task(event: ScriptTask) {
    match event {
        ScriptTask::RunCommand(command, libraries, editor_request_channel, editor_state) => {
            println!("Running command {}", command.id);
            handle_script_run(command, libraries, editor_request_channel, editor_state).await
        }
    }
}
