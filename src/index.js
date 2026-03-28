import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const envCheck = dotenv.config({
    path: './.env'
});
console.log("Dotenv Status: ", envCheck);


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
});