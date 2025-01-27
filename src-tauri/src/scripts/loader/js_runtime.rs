use crate::scripts::loader::scripts::Library;
use deno_ast::{MediaType, ParseParams};
use deno_core::anyhow::Error;
use deno_core::error::AnyError;
use deno_core::{
    resolve_import, ModuleCodeString, ModuleLoadResponse, ModuleLoader, ModuleName, ModuleSource,
    ModuleSourceCode, ModuleSpecifier, ModuleType, RequestedModuleType, ResolutionKind,
    SourceMapData,
};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

pub struct SnipModuleLoader {
    allowed_locations: Mutex<Vec<String>>,
    libraries: HashMap<String, Library>,
}

impl ModuleLoader for SnipModuleLoader {
    fn resolve(
        &self,
        specifier: &str,
        referrer: &str,
        _kind: ResolutionKind,
    ) -> Result<ModuleSpecifier, Error> {
        Ok(resolve_import(specifier, referrer)?)
    }

    fn load(
        &self,
        module_specifier: &ModuleSpecifier,
        _maybe_referrer: Option<&ModuleSpecifier>,
        _is_dyn_import: bool,
        _requested_module_type: RequestedModuleType,
    ) -> ModuleLoadResponse {
        let module_specifier = module_specifier.clone();

        let module_load = move || {
            let mut path;
            let module;
            match module_specifier.scheme() {
                "file" => {
                    path = module_specifier.to_file_path().unwrap();

                    if !self
                        .allowed_locations
                        .lock()
                        .unwrap()
                        .iter()
                        .any(|location| path.starts_with(location))
                    {
                        return Err(Error::msg("Loading files from outside of the current script or the used libraries is not allowed"));
                    }

                    if MediaType::from_path(&path) == MediaType::Unknown {
                        for ext in &["ts", "tsx", "js", "jsx"] {
                            let new_path = path.with_extension(ext);
                            if new_path.is_file() {
                                path = new_path;
                                break;
                            }
                        }
                    }

                    module = SnipModuleLoader::load_module_from_file(&module_specifier, &path)?;
                }
                "lib" => {
                    let path = module_specifier.path();
                    let library_name = if path.starts_with("@") {
                        path.split('/').take(2).collect::<Vec<&str>>().join("/")
                    } else {
                        path.split('/').next().unwrap().to_string()
                    };
                    let sub_path = path.strip_prefix(&library_name).unwrap().to_string();
                    let library = self.libraries.get(&library_name).ok_or_else(|| {
                        Error::msg(format!("Library not found: {}", library_name))
                    })?;
                    let location = library.get_location();
                    let mut path = PathBuf::from(format!("{}{}", location, sub_path));
                    self.allowed_locations
                        .lock()
                        .unwrap()
                        .push(location.to_string());

                    if path.is_dir() {
                        path = path.join("index");
                    }
                    if !path.is_file() {
                        for ext in &["ts", "tsx", "js", "jsx"] {
                            let new_path = path.with_extension(ext);
                            if new_path.is_file() {
                                path = new_path;
                                break;
                            }
                        }
                    }

                    module = SnipModuleLoader::load_module_from_file(&module_specifier, &path)?;
                }
                _ => {
                    return Err(Error::msg(format!(
                        "Unsupported scheme: {}",
                        module_specifier.scheme()
                    )))
                }
            }
            Ok(module)
        };

        ModuleLoadResponse::Sync(module_load())
    }
}

impl SnipModuleLoader {
    pub fn new(script_path: impl Into<String>, libraries: HashMap<String, Library>) -> Self {
        SnipModuleLoader {
            allowed_locations: Mutex::new(vec![script_path.into()]),
            libraries,
        }
    }
    fn load_module_from_file(
        original_module_specifier: &ModuleSpecifier,
        path: &Path,
    ) -> Result<ModuleSource, Error> {
        let module_specifier = ModuleSpecifier::from_file_path(path).unwrap();
        let media_type = MediaType::from_path(path);
        let should_transpile = match media_type {
            MediaType::Jsx
            | MediaType::TypeScript
            | MediaType::Mts
            | MediaType::Cts
            | MediaType::Dts
            | MediaType::Dmts
            | MediaType::Dcts
            | MediaType::Tsx => true,
            MediaType::JavaScript | MediaType::Mjs | MediaType::Cjs => false,
            _ => return Err(Error::msg("Unsupported or unknown media type")),
        };

        let code = std::fs::read_to_string(path)?;
        let code = if should_transpile {
            let parsed = deno_ast::parse_module(ParseParams {
                specifier: module_specifier.clone(),
                text: code.into(),
                media_type,
                capture_tokens: false,
                scope_analysis: false,
                maybe_syntax: None,
            })?;
            let transpiled_source = parsed
                .transpile(
                    &Default::default(),
                    &Default::default(),
                    &Default::default(),
                )?
                .into_source();
            transpiled_source.text
        } else {
            code
        };

        // Load and return module.
        Ok(ModuleSource::new_with_redirect(
            ModuleType::JavaScript,
            ModuleSourceCode::String(code.into()),
            original_module_specifier,
            &module_specifier,
            None,
        ))
    }
}

pub fn transpile_extension(
    name: ModuleName,
    code: ModuleCodeString,
) -> Result<(ModuleCodeString, Option<SourceMapData>), AnyError> {
    // We expect all extensions to work with typescript, so we parse it as typescript
    let parsed = deno_ast::parse_module(ParseParams {
        specifier: ModuleSpecifier::parse(name.to_string().as_str())?,
        text: code.into(),
        media_type: MediaType::TypeScript,
        capture_tokens: false,
        scope_analysis: false,
        maybe_syntax: None,
    })?;
    let transpiled_source = parsed
        .transpile(
            &Default::default(),
            &Default::default(),
            &Default::default(),
        )?
        .into_source();
    let result_source = transpiled_source.text.into();
    Ok((result_source, None))
}
