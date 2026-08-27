const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { listGroups, createGroup, addMember, deleteGroup } = require('../controllers/groupController');

const router = express.Router();
router.use(requireAuth);
router.get('/', listGroups);
router.post('/', createGroup);
router.post('/:groupId/members', addMember);
router.delete('/:groupId', deleteGroup);

module.exports = router;
