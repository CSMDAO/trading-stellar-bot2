const express = require("express");
const routes = require("./routes");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use("/", routes.stellar);
app.use("/", routes.trading);

app.listen(8080, () => console.log("app listening on 8080"));
