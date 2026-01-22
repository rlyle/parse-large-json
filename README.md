The parseLargeJson function can parse JSON that is larger then the 512MB limit of JSON strings. Just load your huge JSON into a Buffer from a file or the web, then call the parseLargeJson and it will return a JSON object to you, unlike JSON.parse() which will just blow up.

Install:
```
npm install parse-large-json --save
```

Usage:
```
const { parseLargeJson } = require('parse-large-json');
const fs = require('fs');

const veryLargeFile = fs.readFileSync("VeryLarge.json");
const jsonObject = parseLargeJson( veryLargeFile );
```

