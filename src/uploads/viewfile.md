# Review File
```js
import * as Inputs from "npm:@observablehq/inputs";

const logFile = view(Inputs.file({
  label: "Upload Combat Log",
  accept: ".txt,.log",
  required: false
}));
```

```js
logFile.text()
```