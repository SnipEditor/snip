use deno_ast::{MediaType, ParseParams};
use deno_core::anyhow::Error;
use deno_core::error::AnyError;
use deno_core::{
    resolve_import, ModuleCodeString, ModuleLoadResponse, ModuleLoader, ModuleName,
    ModuleSourceCode, ModuleSpecifier, RequestedModuleType, ResolutionKind, SourceMapData,
};

pub struct SnipModuleLoader;

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
            let path = module_specifier.to_file_path().unwrap();

            // Determine what the MediaType is (this is done based on the file
            // extension) and whether transpiling is required.
            let media_type = MediaType::from_path(&path);
            let (module_type, should_transpile) = match MediaType::from_path(&path) {
                MediaType::JavaScript | MediaType::Mjs | MediaType::Cjs => {
                    (deno_core::ModuleType::JavaScript, false)
                }
                MediaType::Jsx => (deno_core::ModuleType::JavaScript, true),
                MediaType::TypeScript
                | MediaType::Mts
                | MediaType::Cts
                | MediaType::Dts
                | MediaType::Dmts
                | MediaType::Dcts
                | MediaType::Tsx => (deno_core::ModuleType::JavaScript, true),
                MediaType::Json => (deno_core::ModuleType::Json, false),
                _ => panic!("Unknown extension {:?}", path.extension()),
            };

            // Read the file, transpile if necessary.
            let code = std::fs::read_to_string(&path)?;
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
            let module = deno_core::ModuleSource::new(
                module_type,
                ModuleSourceCode::String(code.into()),
                &module_specifier,
                None,
            );
            Ok(module)
        };

        ModuleLoadResponse::Sync(module_load())
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
