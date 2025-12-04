// See https://observablehq.com/framework/config for documentation.
export default {
  // The app’s title; used in the sidebar and webpage titles.
  title: "TlStatistics",

  dynamicPaths: [
    "/modules/sparkbar.js"
  ],

  pages: [
    {
      name: "Summarys",
      pages: [
        {name: "Dashboard", path: "/dashboard"},
        {name: "Statistics", path: "/statistics"},
        {name: "PLayer Report", path: "/report"}
      ]
    },{
      name: "Uploads",
      pages: [
        {name: "Review File", path:"/uploads/viewfile"},
        {name: "Upload File to Github", path: "/uploads/upload"}
      ]
    }
  ],

  // Content to add to the head of the page, e.g. for a favicon:
  head: '<link rel="icon" href="TnlIcon.png" type="image/png" sizes="32x32">',

  // The path to the source root.
  root: "src",

  // Some additional configuration options and their defaults:
  theme: "dark", // try "light", "dark", "slate", etc.
  // header: "TnL Dps Stats", // what to show in the header (HTML)
  footer: `<a href="https://ko-fi.com/Q5Q4YAI3F" target="_blank"><img height="36" style="border:0px;height:36px;" src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" border="0" alt="Buy Me a Coffee at ko-fi.com" /></a><a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en">cc-by-sa-4.0</a>`,
  // sidebar: true, // whether to show the sidebar
  // toc: true, // whether to show the table of contents
  // pager: true, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // preserveExtension: false, // drop .html from URLs
  // preserveIndex: false, // drop /index from URLs
};
