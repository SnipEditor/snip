use crate::scripts::commands::{handle_script_task, ScriptTask, WindowScriptState};
use std::collections::HashMap;
use std::thread;
use std::thread::JoinHandle;
use tauri::{AppHandle, Error, WebviewUrl, WebviewWindowBuilder};
use tokio::runtime;
use tokio::sync::mpsc::error::SendError;
use tokio::sync::mpsc::{channel, Receiver, Sender};

pub enum WindowTask {
    Script(ScriptTask),
    Close,
}

pub struct WindowState {
    thread_join_handle: JoinHandle<()>,
    task_sender: Sender<WindowTask>,
    script_state: WindowScriptState,
}

pub struct Windows {
    window_states: HashMap<String, WindowState>,
    last_window_id: u32,
}

fn window_task_listener(mut task_receiver: Receiver<WindowTask>) {
    let rt = runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .expect("Could not create tokio runtime");
    rt.block_on(async {
        loop {
            let task = task_receiver.recv().await;
            if let Some(task) = task {
                match task {
                    WindowTask::Script(script_event) => handle_script_task(script_event).await,
                    WindowTask::Close => break,
                }
            } else {
                break;
            }
        }
    })
}

impl Windows {
    pub fn new() -> Self {
        Self {
            window_states: HashMap::new(),
            last_window_id: 0,
        }
    }

    pub fn create_window(&mut self, app_handle: &AppHandle) -> Result<(), Error> {
        self.last_window_id += 1;
        let id = format!("main_{}", self.last_window_id);

        let (task_sender, task_receiver) = channel(8);

        let thread_join_handle = thread::Builder::new()
            .name(format!("{}_runner", id))
            .spawn(move || window_task_listener(task_receiver))?;

        self.window_states.insert(
            id.clone(),
            WindowState {
                thread_join_handle,
                task_sender,
                script_state: Default::default(),
            },
        );

        WebviewWindowBuilder::new(
            app_handle,
            id,
            WebviewUrl::App("windows/index.html".parse().unwrap()),
        )
        .min_inner_size(800.0, 600.0)
        .title(format!("Snip - Untitled {}", self.last_window_id))
        .build()?;

        Ok(())
    }

    pub async fn queue_task(
        &self,
        window_id: &String,
        task: WindowTask,
    ) -> Result<(), SendError<WindowTask>> {
        let window_state = self.window_states.get(window_id);
        if let Some(window_state) = window_state {
            window_state.task_sender.send(task).await?;
            Ok(())
        } else {
            Err(SendError(task))
        }
    }

    pub fn get_script_state(&mut self, window_id: &str) -> Option<&mut WindowScriptState> {
        let window_state = self.window_states.get_mut(window_id);
        if let Some(window_state) = window_state {
            Some(&mut window_state.script_state)
        } else {
            None
        }
    }

    pub fn destroy_window(&mut self, window_id: &str) {
        if let Some(window_state) = self.window_states.remove(window_id) {
            window_state
                .task_sender
                .blocking_send(WindowTask::Close)
                .unwrap();
            window_state.thread_join_handle.join().unwrap();
        }
    }

    pub fn has_open(&self) -> bool {
        !self.window_states.is_empty()
    }
}
