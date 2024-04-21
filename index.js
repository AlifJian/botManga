const express = require("express");
const app = express();
const fs = require("fs");
app.get("/jian/api", (req,res) => {
    fs.writeFileSync("COPY.pdf", fs.readFileSync("./2751126.pdf"));
    res.json({"msg" : "HELLOW", "Buffer" : fs.readFileSync("./2751126.pdf") })
})

app.listen(3000, (p) => {
    console.log("Server Runing" + p);
})
