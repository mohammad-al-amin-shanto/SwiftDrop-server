import app from "./app";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(
    `Server listening on http://localhost:${PORT} (env=${
      process.env.NODE_ENV || "dev"
    })`
  );
});
