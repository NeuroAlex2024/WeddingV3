export default {
  input: 'src/frontend/main.js',
  output: {
    file: 'public/app.js',
    format: 'iife',
    sourcemap: false,
  },
  treeshake: false,
};
