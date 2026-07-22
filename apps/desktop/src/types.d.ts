interface Window {
  __TAURI_INTERNALS__?: any;
}

declare module "*.css" {
  const content: any;
  export default content;
}
