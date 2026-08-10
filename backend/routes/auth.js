const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { users } = require('../data/store');
const { protect, generateToken } = require('../middleware/auth');

// Auth Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let emailOrPhone = email.trim().toLowerCase();
    
    // Support shorthand credentials
    if (emailOrPhone === 'arjun' || emailOrPhone === 'student') {
      emailOrPhone = 'arjun@rvhub.com';
    } else if (emailOrPhone === 'priya' || emailOrPhone === 'faculty') {
      emailOrPhone = 'priya@rvhub.com';
    } else if (emailOrPhone === 'admin') {
      emailOrPhone = 'admin@rvhub.com';
    }

    const user = users.find(u => u.email.toLowerCase() === emailOrPhone || u.phone === emailOrPhone);
    if (!user) {
      return res.status(400).json({ message: 'User does not exist' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    const token = generateToken(user._id);
    const profile = { ...user };
    delete profile.password;
    res.json({ token, user: profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SAP SuccessFactors SSO Endpoint
router.post('/sso', async (req, res) => {
  const { role, email } = req.body;
  try {
    let targetEmail = (email || '').trim().toLowerCase();
    let user;

    if (targetEmail) {
      user = users.find(u => u.email.toLowerCase() === targetEmail);
    }

    if (!user && role) {
      user = users.find(u => u.role === role);
    }

    if (!user) {
      user = users.find(u => u.role === 'student') || users[0];
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found for SSO' });
    }

    const token = generateToken(user._id);
    const profile = { ...user };
    delete profile.password;
    res.json({
      token,
      user: profile,
      ssoProvider: 'SAP SuccessFactors',
      ssoStatus: 'Authenticated'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Auth Register
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  try {
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = {
      _id: String(Date.now()),
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'student',
      ava: name.charAt(0),
      batch: 'General',
      roll: 'RV' + Math.floor(1000 + Math.random() * 9000),
      streak: 1,
      avgScore: 75,
      feeStatus: 'Due',
      feeAmount: 30000,
      feePaid: 0,
      feePending: 30000,
      feeDueDate: 'Next Month',
      feeMethod: '—',
      feeDate: '—',
      campus: 'RV Main Campus',
      gender: 'Other',
      st: 'active'
    };

    users.push(newUser);
    const token = generateToken(newUser._id);
    const profile = { ...newUser };
    delete profile.password;
    res.status(201).json({ token, user: profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Profile GET
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

// Profile PUT
router.put('/profile', protect, async (req, res) => {
  const user = users.find(u => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.email !== undefined) user.email = req.body.email;
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  if (req.body.gender !== undefined) user.gender = req.body.gender;
  if (req.body.dob !== undefined) user.dob = req.body.dob;
  if (req.body.designation !== undefined) user.designation = req.body.designation;
  if (req.body.dept !== undefined) user.dept = req.body.dept;
  if (req.body.subject !== undefined) user.subject = req.body.subject;
  if (req.body.campus !== undefined) user.campus = req.body.campus;
  if (req.body.joinDate !== undefined) user.joinDate = req.body.joinDate;
  if (req.body.roll !== undefined) user.roll = req.body.roll;
  if (req.body.batch !== undefined) user.batch = req.body.batch;

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
  }

  const profile = { ...user };
  delete profile.password;
  res.json(profile);
});

// Admin list users GET
router.get('/users', protect, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }
  const profiles = users.map(u => {
    const p = { ...u };
    delete p.password;
    return p;
  });
  res.json(profiles);
});

// Admin User CRUD updates
router.put('/users/:id', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const user = users.find(u => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.email !== undefined) user.email = req.body.email;
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  if (req.body.gender !== undefined) user.gender = req.body.gender;
  if (req.body.dob !== undefined) user.dob = req.body.dob;
  if (req.body.designation !== undefined) user.designation = req.body.designation;
  if (req.body.dept !== undefined) user.dept = req.body.dept;
  if (req.body.subject !== undefined) user.subject = req.body.subject;
  if (req.body.campus !== undefined) user.campus = req.body.campus;
  if (req.body.joinDate !== undefined) user.joinDate = req.body.joinDate;
  if (req.body.roll !== undefined) user.roll = req.body.roll;
  if (req.body.batch !== undefined) user.batch = req.body.batch;
  if (req.body.feeStatus !== undefined) user.feeStatus = req.body.feeStatus;
  if (req.body.feeAmount !== undefined) user.feeAmount = Number(req.body.feeAmount);
  if (req.body.feePaid !== undefined) user.feePaid = Number(req.body.feePaid);
  if (req.body.feePending !== undefined) user.feePending = Number(req.body.feePending);

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
  }

  const profile = { ...user };
  delete profile.password;
  res.json(profile);
});

router.put('/users/:id/status', protect, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const user = users.find(u => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (req.body.st !== undefined) {
    user.st = req.body.st;
  } else {
    user.st = user.st === 'active' ? 'warning' : 'active';
  }
  res.json(user);
});

router.delete('/users/:id', protect, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const idx = users.findIndex(u => u._id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: 'User not found' });
  users.splice(idx, 1);
  res.json({ message: 'User deleted successfully' });
});

module.exports = router;
