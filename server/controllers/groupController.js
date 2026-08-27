const Group = require('../models/Group');
const User = require('../models/User');

async function listGroups(req, res, next) {
  try {
    const groups = await Group.find({ members: req.userId }).populate('members', 'name username avatarUrl');
    res.json({ groups });
  } catch (err) { next(err); }
}

async function createGroup(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Group name is required.' });
    const group = await Group.create({ name, owner: req.userId, members: [req.userId] });
    res.status(201).json({ group });
  } catch (err) { next(err); }
}

async function addMember(req, res, next) {
  try {
    const group = await Group.findOne({ _id: req.params.groupId, owner: req.userId });
    if (!group) return res.status(404).json({ error: 'Group not found.' });
    const username = String(req.body.username || '').trim().toLowerCase();
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (!group.members.some((member) => member.toString() === user._id.toString())) group.members.push(user._id);
    await group.save();
    await group.populate('members', 'name username avatarUrl');
    res.json({ group });
  } catch (err) { next(err); }
}

async function deleteGroup(req, res, next) {
  try {
    const result = await Group.deleteOne({ _id: req.params.groupId, owner: req.userId });
    if (!result.deletedCount) return res.status(404).json({ error: 'Group not found.' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { listGroups, createGroup, addMember, deleteGroup };
