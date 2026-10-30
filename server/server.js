// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas (connection string comes from the MONGODB_URI environment variable)
if (!process.env.MONGODB_URI) {
  console.error(
    "MONGODB_URI is not set. Add it to .env or your host's environment variables.",
  );
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() =>
    console.log(`MongoDB Atlas connected: ${mongoose.connection.name}`),
  )
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Ongoing", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

const Task = mongoose.model("Task", TaskSchema);

// Get all tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ message: "Server error. Could not fetch tasks." });
  }
});

// Create a new task
app.post("/tasks", async (req, res) => {
  try {
    const { title } = req.body;
    const task = new Task({ title });
    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(400).json({ message: "Invalid data. Could not create task." });
  }
});

// Update task status
app.patch("/tasks/:id", async (req, res) => {
  const { status } = req.body;
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );
    if (!updatedTask)
      return res.status(404).json({ message: "Task not found." });
    res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task status:", err);
    res
      .status(500)
      .json({ message: "Server error. Could not update task status." });
  }
});

// Delete a task
app.delete("/tasks/:id", async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask)
      return res.status(404).json({ message: "Task not found." });
    res.json({ message: "Task deleted." });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ message: "Server error. Could not delete task." });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
