## pipefy-stream

A nodeJS utility to handle streams pipeline

### Install

```
npm install pipefy-stream
```

### Usage

```
const fs = require('fs');
const pipefy = require('pipefy-stream');

const read = fs.createReadStream('someReadFile.txt');
const write = fs.createWriteStream('someWriteFile.txt');

pipefy([read, write], { propagateError: true }, error => {
  if (error) {
    console.log(error);
  } else {
    console.log('SUCCESS');
  }
});

```

### License

MIT
