import mongoose from "mongoose";

let isConnected = false;

export const connectToCoreDB = async () => {
  mongoose.set("strictQuery", true);

  if (isConnected) {
    if (process.env.ENV === "debug")
      console.log("MongoDB is already connected");
    return;
  }
  try {
    let connection = await mongoose.connect(
      process.env.MONGODB_URL || "mongodb://localhost:27017",
      {
        dbName: process.env.DB_NAME || "alchemyst-zendocs",
        // useNewUrlParser: true,
        // useUnifiedTopology: true
      },
    );

    const queryTimeoutMs =
      parseInt(process.env.MONGODB_QUERY_TIMEOUT_MS || "") || 90000;

    const bufferTimeoutMs =
      parseInt(process.env.MONGODB_BUFFER_TIMEOUT_MS || "") || 90000;

    console.log(
      "Setting custom Query Timeout (in s) to: ",
      queryTimeoutMs / 1000,
    );
    connection.set({
      maxTimeMS: queryTimeoutMs,
      bufferTimeoutMS: bufferTimeoutMs,
    });

    isConnected = true;
    if (process.env.ENV === "debug") console.log("Connected to DB");
  } catch (error) {
    if (process.env.ENV === "debug") console.log(error);
  }
};
