// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title TodoList
/// @notice A personal, on-chain to-do list. Every wallet has its own independent
///         list of tasks and can add, edit, toggle (done/undone), and delete them.
/// @dev    Demonstrates per-user storage (`mapping(address => Task[])`), full CRUD,
///         and gas-friendly deletion via swap-and-pop. No funds are handled.
contract TodoList {
    uint256 public constant MAX_TEXT_LENGTH = 256;

    struct Task {
        uint256 id; // stable id, unique per owner (never reused)
        string text;
        bool done;
        uint256 createdAt;
    }

    /// @dev Each address owns its own array of tasks.
    mapping(address => Task[]) private _tasks;
    /// @dev Per-owner counter so each task gets a unique, non-reused id.
    mapping(address => uint256) private _nextId;

    event TaskAdded(address indexed owner, uint256 indexed id, string text);
    event TaskEdited(address indexed owner, uint256 indexed id, string text);
    event TaskToggled(address indexed owner, uint256 indexed id, bool done);
    event TaskDeleted(address indexed owner, uint256 indexed id);

    /// @notice Add a new task to the caller's list.
    function addTask(string calldata text) external {
        require(bytes(text).length > 0, "Text required");
        require(bytes(text).length <= MAX_TEXT_LENGTH, "Text too long");

        uint256 id = _nextId[msg.sender]++;
        _tasks[msg.sender].push(
            Task({id: id, text: text, done: false, createdAt: block.timestamp})
        );
        emit TaskAdded(msg.sender, id, text);
    }

    /// @notice Edit the text of an existing task (by array index).
    function editTask(uint256 index, string calldata text) external {
        require(index < _tasks[msg.sender].length, "Bad index");
        require(bytes(text).length > 0, "Text required");
        require(bytes(text).length <= MAX_TEXT_LENGTH, "Text too long");

        Task storage task = _tasks[msg.sender][index];
        task.text = text;
        emit TaskEdited(msg.sender, task.id, text);
    }

    /// @notice Flip a task between done and not done.
    function toggleTask(uint256 index) external {
        require(index < _tasks[msg.sender].length, "Bad index");
        Task storage task = _tasks[msg.sender][index];
        task.done = !task.done;
        emit TaskToggled(msg.sender, task.id, task.done);
    }

    /// @notice Delete a task. Uses swap-and-pop, so the order is not preserved.
    function deleteTask(uint256 index) external {
        uint256 len = _tasks[msg.sender].length;
        require(index < len, "Bad index");

        uint256 deletedId = _tasks[msg.sender][index].id;
        // Move the last task into the deleted slot, then drop the last entry.
        if (index != len - 1) {
            _tasks[msg.sender][index] = _tasks[msg.sender][len - 1];
        }
        _tasks[msg.sender].pop();
        emit TaskDeleted(msg.sender, deletedId);
    }

    /// @notice Get all tasks for a given owner.
    function getTasks(address owner) external view returns (Task[] memory) {
        return _tasks[owner];
    }

    /// @notice Get the caller's own tasks.
    function getMyTasks() external view returns (Task[] memory) {
        return _tasks[msg.sender];
    }

    /// @notice How many tasks an owner currently has.
    function taskCount(address owner) external view returns (uint256) {
        return _tasks[owner].length;
    }
}
