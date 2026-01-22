import _ from 'lodash';

///! Search backwards on the text string, and find a valid ending to the JSON
//! that isn't inside a unterminated string... a valid ending will be the end of an object }, or 
//! array ], but we will need to find a ":" or "," prior to finding that ending.
export function findValidJsonEnding(text) {
    let pos = text.length - 1;
    let lastPropertyStart = -1;

    while (pos > 0) {
        const char = text[pos--];
        if (char === ',' && (text[pos] === ']' || text[pos] === '}')) {
            if ( lastPropertyStart > pos ) {
                return pos;
            }
        } else if (char === '"' && (text[pos] === ',' || text[pos] === ':') && text[pos - 1] === '"') {
            lastPropertyStart = pos + 1;
        }
    }

    // no valid ending found, assume the json is complete then..
    return -1;
}

//! A string in javascript can't be over 512MB, so when we have JSON that is over that limit
//! it just blows up. This function takes a ArrayBuffer type, which can be very large and converts
//! each binary chunk into text, parses a smaller chunk of json, then combines with a single object

//! (c)2025 Richard Lyle
export function parseLargeJson(buffer, chunkSize = 10 * 1024 * 1024 ) {
    const decoder = new TextDecoder('utf-8');
    if ( buffer.byteLength < chunkSize ) {
        // json is smaller then the chunk size, so just decode the entire thing and parse..
        return JSON.parse(decoder.decode(buffer));
    }
    let jsonDoc = {};               // the parsed json document
    let remainingChunk = '';        // text to carry over to the next chunk
    let jsonStack = [];             // current stack into the json object..

    for (let i = 0; i < buffer.byteLength; i += chunkSize) {
        console.log(`parseLargeJson ${Math.floor((i / buffer.byteLength) * 100)}% done...`);
        const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.byteLength));
        const decodedChunk = decoder.decode(chunk, { stream: true });
        const lastChunk = (i + chunkSize) >= buffer.byteLength;

        let textChunk = remainingChunk + decodedChunk;
        remainingChunk = '';
        if (! lastChunk ) {
            const lastEnding = findValidJsonEnding(textChunk);
            //console.log(`lastEnding: ${lastEnding}, lastStringEnd: ${lastStringEnd}, lastObjectEnd: ${lastObjectEnd}, lastArrayEnd: ${lastArrayEnd}`);

            if ( lastEnding < 0) {
                if ( i < buffer.byteLength) {
                    // if something is longer then a chunk, just save into the remaining chunk, and combine with the next chunk..
                    remainingChunk = textChunk;    
                    continue;
                }
            }
            else  {
                remainingChunk = textChunk.substring(lastEnding + 2);      // put the text after the ending end into the remainingText
                textChunk = textChunk.substring( 0, lastEnding + 1 );      // remove everything starting at the , from the textChunk
            }
        }

        const RESERVED_NAMES = [ '[', ']', '{', '}', ','];
        // make a copy of the previous jsonStack
        const prevStack = [ ...jsonStack ];
        // match against , {} and [] on anything that is not inside quotes, so we can determine how to modify our json stack...
        // eslint-disable-next-line no-useless-escape
        const brackets = textChunk.match(/"(?:[^"\\]|\\.)*"|([,{}\[\]])/g);
        if ( brackets ) {
            for(let i=0;i<brackets.length;++i) {
                if (brackets[i] === '{') {
                    const name = i > 0 && !RESERVED_NAMES.includes(brackets[i-1]) ? brackets[i-1] : undefined;
                    jsonStack.push({ type: 'object', name });
                } else if (brackets[i] === '}') {
                    jsonStack.pop();        // remove the top of the stack
                } else if (brackets[i] === '[') {
                    const name = i > 0 && !RESERVED_NAMES.includes(brackets[i-1]) ? brackets[i-1] : undefined;
                    jsonStack.push({ type: 'array', name, length: 0 });
                } else if (brackets[i] === ']') {
                    jsonStack.pop();
                } else if ( brackets[i] === ',') {
                    const top = jsonStack.at(-1);
                    if ( top.type === 'array') {
                        top.length += 1;        // next array element
                    }
                }
            }
        }

        // generate the textPrefix and textPostfix based on the jsonStack, so JSON.parse can 
        // parse successfully, then we can merge that partial object with the full jsonDoc..
        let textPrefix = '';            // prefix for the textChunk so JSON.parse works
        for(let i=0;i<prevStack.length;++i) {
            const stack = prevStack[i];
            if ( stack.type === 'object') {
                textPrefix += stack.name ? `${stack.name}:{` : '{';     // note if it has no name, then it's an anonymous object
            } else { //if ( stack.type === 'array') {
                textPrefix += stack.name ? `${stack.name}:[` : '['      // same thing with arrays, if no name, then it's an anonymous array
            } 
        }
        let textPostfix = '';                                           // postfix for the textChunk so JSON.parse works
        for(let i=jsonStack.length-1;i>=0;--i) {                        // we go backwards, because we are closing out the stack
            const stack = jsonStack[i];
            if (stack.type === 'object') {
                textPostfix += '}';
            } else { // if ( stack.type === 'array') {
                textPostfix += ']';                
            }
        }

        let jsonChunk = null;
        try {
            const parseText = textPrefix + textChunk + textPostfix;
            jsonChunk = JSON.parse(parseText);
        } catch(err) {
            console.error("parseLargeJson error:", err );
            console.error("brackets:", brackets );
            console.error("prevStack:", prevStack );
            console.error("jsonStack:", jsonStack );
            console.error("textPrefix:", textPrefix);
            console.error("textChunk (last 256 bytes):", textChunk.substring( textChunk.length - 256 ) );
            console.error("textPostfix:", textPostfix );
            console.error("remainingChunk:", remainingChunk );
            throw err;
        }

        // This recursive merge functions, uses our prevStack, to understand how to merge the jsonChunk
        // into the jsonDoc. It knows that the jsonChunk can be partial, and based on the stack we are going 
        // to either merge into an existing element in an array, or just concat a new element based on when 
        // we hit the stack top and what type of object it is.
        // eslint-disable-next-line no-inner-declarations
        function mergeJson( target, src, depth = 0 ) {
            if ( _.isArray(target) ) {
                if (! _.isArray(src) ) throw new Error("target is array, src is not!");
                if ( prevStack[depth].type !== 'array' ) throw new Error(`stack at depth ${depth} is not an array!`);
                if ( prevStack.length > (depth + 1) ) {
                    // not at the top of the stack yet, so merge the last element in the target, with the first element of the source
                    mergeJson(target.at(-1), src.at(0), depth + 1 );
                    // concat any remaining array elements
                    src.shift();
                    if ( src.length > 0 ) {
                        target.push(...src)
                    }
                } else {
                    // we are at the top, but they are arrays, so concat the arrays then..
                    target.push( ...src );
                }
            } else if ( typeof target === 'object') {
                if ( typeof src !== 'object' ) throw new Error("target is object, src is not!");
                for(let k in src ) {
                    if ( target[k] !== undefined ) {
                        mergeJson(target[k], src[k], depth + 1);
                    } else {
                        target[k] = src[k];
                    }
                }
            }
        }
        mergeJson( jsonDoc, jsonChunk );
    }
    return jsonDoc;
}

