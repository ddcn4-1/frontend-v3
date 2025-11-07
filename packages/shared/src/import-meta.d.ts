type ImportMetaEnv = Readonly<Record<string, string | undefined>>;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
