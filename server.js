const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lưu dữ liệu vào file JSON để không mất khi khởi động lại server
function loadTodos() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveTodos() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

let todos = loadTodos();
let nextId = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1;

// Lấy danh sách công việc
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// Thêm công việc mới
app.post('/api/todos', (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) {
    return res.status(400).json({ error: 'Tiêu đề không được để trống' });
  }
  const todo = {
    id: nextId++,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  todos.push(todo);
  saveTodos();
  res.status(201).json(todo);
});

// Cập nhật công việc (tiêu đề hoặc trạng thái)
app.put('/api/todos/:id', (req, res) => {
  const todo = todos.find((t) => t.id === Number(req.params.id));
  if (!todo) {
    return res.status(404).json({ error: 'Không tìm thấy công việc' });
  }
  if (typeof req.body.title === 'string') {
    const title = req.body.title.trim();
    if (!title) {
      return res.status(400).json({ error: 'Tiêu đề không được để trống' });
    }
    todo.title = title;
  }
  if (typeof req.body.completed === 'boolean') {
    todo.completed = req.body.completed;
  }
  saveTodos();
  res.json(todo);
});

// Xóa các công việc đã hoàn thành
app.delete('/api/todos/completed', (req, res) => {
  todos = todos.filter((t) => !t.completed);
  saveTodos();
  res.status(204).end();
});

// Xóa một công việc
app.delete('/api/todos/:id', (req, res) => {
  const index = todos.findIndex((t) => t.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy công việc' });
  }
  todos.splice(index, 1);
  saveTodos();
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
