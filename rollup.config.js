import {terser} from "rollup-plugin-terser";
import pkg from './package.json';

export default {
 input: 'src/main.js', // our source file
 output: [
  {
   file: pkg.main,
   format: 'cjs'
  },
  {
   file: pkg.module,
   format: 'es' // the preferred format
  },
  {
   file: pkg.browser,
   format: 'iife',
   name: 'jsondiffpatchArraysByHash' // the global which can be used in a browser
  }
 ],
 external: [
  ...Object.keys(pkg.dependencies || {})
 ],
 plugins: [
  terser() // minifies generated bundles
 ]
};