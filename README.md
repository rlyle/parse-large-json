The parseHugeJson function can parse JSON that is larger then the 512MB limit of JSON strings. Just load your huge JSON into a Buffer from a file or the web, then call the parseHugeJson and it will return a JSON object.

Install:
```
npm install parse-large-json --save
```

Usage:
```
const { parseHugeJson } = require('parse-large-json');
const fs = require('fs');

const veryLargeFile = fs.readFileSync("VeryLarge.json");
const jsonObject = parseHugeJson( veryLargeFile );
```

