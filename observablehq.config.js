// See https://observablehq.com/framework/config for documentation.
export default {
  title: "TlStatistics",

  pages: [
    {
      name: "Summarys",
      pages: [
        {name: "Dashboard", path: "/dashboard"},
        {name: "Raid Statistics", path: "/statisticsRaid"},
        {name: "Boss Statistics", path: "/statisticsBoss"},
        {name: "Dungeon Statistics", path: "/statisticsDungeons"},
        {name: "Weapon Statistics", path: "/statisticsWeapon"},
        {name: "Player Report", path: "/report"}
      ]
    },{
      name: "Uploads",
      pages: [
        {name: "Review File", path:"/uploads/viewfile"},
        {name: "Upload File to Github", path: "/uploads/upload"}
      ]
    },{name: "Patchnotes", path:"/patch"}
  ],

  head: '<link rel="icon" href="TnlIcon.png" type="image/png" sizes="32x32">',

  root: "src",
  //interpreters: { ".py": ["./.venv/Scripts/python"], }, //comment before uploading

  // Some additional configuration options and their defaults:
  theme: ["dashboard","air","deep-space"],
  // header: "TnL Dps Stats", // what to show in the header (HTML)
  footer: `<a href="https://ko-fi.com/Q5Q4YAI3F" target="_blank"><img height="36" style="border:0px;height:36px;" src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" border="0" alt="Buy Me a Coffee at ko-fi.com" /></a><a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en">cc-by-sa-4.0</a>`,
  // sidebar: true, // whether to show the sidebar
  toc: false, // whether to show the table of contents
  pager: false, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // preserveExtension: false, // drop .html from URLs
  // preserveIndex: false, // drop /index from URLs
};
