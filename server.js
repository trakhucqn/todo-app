const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');
const LABELS_FILE = path.join(__dirname, 'labels.json');

// Bảng màu cho nhãn (giao diện tự chọn sắc độ phù hợp với chế độ sáng/tối)
const COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lưu dữ liệu vào file JSON để không mất khi khởi động lại server
function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function saveTodos() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

function saveLabels() {
  fs.writeFileSync(LABELS_FILE, JSON.stringify(labels, null, 2));
}

// Công việc tạo trước khi có tính năng nhãn sẽ được gán danh sách nhãn rỗng
let todos = loadJSON(DATA_FILE).map((t) => ({ labels: [], ...t }));
let nextId = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1;

let labels = loadJSON(LABELS_FILE);
let nextLabelId = labels.reduce((max, l) => Math.max(max, l.id), 0) + 1;

// Kiểm tra danh sách id nhãn gửi lên, bỏ trùng lặp; trả về null nếu không hợp lệ
function parseLabelIds(value) {
  if (!Array.isArray(value)) return null;
  const ids = [...new Set(value.map(Number))];
  return ids.every((id) => labels.some((l) => l.id === id)) ? ids : null;
}

// Kiểm tra tên và màu nhãn; trả về thông báo lỗi hoặc null nếu hợp lệ
function validateLabel({ name, color }, currentId) {
  if (name !== undefined) {
    if (!name) return 'Tên nhãn không được để trống';
    if (name.length > 30) return 'Tên nhãn tối đa 30 ký tự';
    const lower = name.toLowerCase();
    if (labels.some((l) => l.id !== currentId && l.name.toLowerCase() === lower)) {
      return 'Nhãn này đã tồn tại';
    }
  }
  if (color !== undefined && !COLORS.includes(color)) {
    return 'Màu không hợp lệ';
  }
  return null;
}

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
  const todoLabels = req.body.labels === undefined ? [] : parseLabelIds(req.body.labels);
  if (!todoLabels) {
    return res.status(400).json({ error: 'Nhãn không hợp lệ' });
  }
  const todo = {
    id: nextId++,
    title,
    completed: false,
    labels: todoLabels,
    createdAt: new Date().toISOString(),
  };
  todos.push(todo);
  saveTodos();
  res.status(201).json(todo);
});

// Cập nhật công việc (tiêu đề, trạng thái hoặc nhãn)
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
  if (req.body.labels !== undefined) {
    const todoLabels = parseLabelIds(req.body.labels);
    if (!todoLabels) {
      return res.status(400).json({ error: 'Nhãn không hợp lệ' });
    }
    todo.labels = todoLabels;
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

// Lấy danh sách nhãn
app.get('/api/labels', (req, res) => {
  res.json(labels);
});

// Thêm nhãn mới
app.post('/api/labels', (req, res) => {
  const name = (req.body.name || '').trim();
  const color = req.body.color || 'gray';
  const error = validateLabel({ name, color });
  if (error) {
    return res.status(400).json({ error });
  }
  const label = { id: nextLabelId++, name, color };
  labels.push(label);
  saveLabels();
  res.status(201).json(label);
});

// Cập nhật tên hoặc màu nhãn
app.put('/api/labels/:id', (req, res) => {
  const label = labels.find((l) => l.id === Number(req.params.id));
  if (!label) {
    return res.status(404).json({ error: 'Không tìm thấy nhãn' });
  }
  const changes = {};
  if (typeof req.body.name === 'string') changes.name = req.body.name.trim();
  if (req.body.color !== undefined) changes.color = req.body.color;
  const error = validateLabel(changes, label.id);
  if (error) {
    return res.status(400).json({ error });
  }
  Object.assign(label, changes);
  saveLabels();
  res.json(label);
});

// Xóa nhãn và gỡ nhãn đó khỏi mọi công việc
app.delete('/api/labels/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = labels.findIndex((l) => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy nhãn' });
  }
  labels.splice(index, 1);
  for (const todo of todos) {
    todo.labels = todo.labels.filter((l) => l !== id);
  }
  saveLabels();
  saveTodos();
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
