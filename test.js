const { findValidJsonEnding } = require('.');

try {
    const test1 = "[{\"Property1\":\"value1\"},{\"Property2\":\"value2\"},{\"Property3\":\"value3";
    const test2 = "[{\"Property1\":\"value1\"},{\"Property2\":\"value2\"},{\"Property3\":\"value3\"";
    const test3 = "[{\"Property1\":\"value1\"},{\"Property2\":\"value2\"},{\"Property3\":\"value3\"},{\"Property4\":\"value4\"}]";
    const test4 = "[{\"Property1\":\"value1\"},{\"Property2\":\"value2\"},{\"Property3\":\"value3\"},{\"Property4\":\"valu},e4\"}";
    const test5 = "[{\"Property1\":\"value1\"},{\"Property2\":\"value2\"},{\"Property3\":\"value3],";
    const test6 = "[{\"Property1\":\"value1\"},{\"Property2\":\"value2\"},{\"Property3\":\"all other ongoing activities.\",\"text\":\"receiving EPA financial assistance which is awarded after [the effective date of final regulations],";
    const test7 = "[{\"Property1\":\"value1\"},{\"Property2\":\"value2\"},{\"Property3\":\"all other ongoing activities.\",\"text\":\"receiving EPA financial assistance which is awarded after [the effective date of final regulations]";

    let lastValidEnding = -1;

    lastValidEnding = findValidJsonEnding(test1);
    console.log(`test1: ${lastValidEnding}:`, test1.substring(0, lastValidEnding+1));
    if ( lastValidEnding !== 45) throw new Error("test1 failed!");
    lastValidEnding = findValidJsonEnding(test2);
    console.log(`test2: ${lastValidEnding}:`, test2.substring(0, lastValidEnding+1));
    if ( lastValidEnding !== 45) throw new Error("test2 failed!");
    lastValidEnding = findValidJsonEnding(test3);
    console.log(`test3: ${lastValidEnding}:`, test3.substring(0, lastValidEnding+1));
    if ( lastValidEnding !== 68) throw new Error("test3 failed!");
    lastValidEnding = findValidJsonEnding(test4);
    console.log(`test4: ${lastValidEnding}:`, test4.substring(0, lastValidEnding+1));
    if ( lastValidEnding !== 68) throw new Error("test4 failed!");
    lastValidEnding = findValidJsonEnding(test5);
    console.log(`test5: ${lastValidEnding}:`, test5.substring(0, lastValidEnding+1));
    if ( lastValidEnding !== 45) throw new Error("test5 failed!");
    lastValidEnding = findValidJsonEnding(test6);
    console.log(`test6: ${lastValidEnding}:`, test6.substring(0, lastValidEnding+1));
    if ( lastValidEnding !== 45) throw new Error("test6 failed!");
    lastValidEnding = findValidJsonEnding(test7);
    console.log(`test7: ${lastValidEnding}:`, test7.substring(0, lastValidEnding+1));
    if ( lastValidEnding !== 45) throw new Error("test7 failed!");

    process.exit(0);
} catch(err) {
    console.error("test error:", err );
    process.exit(1);
}
