const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TodoList", function () {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("TodoList");
    const todo = await Factory.deploy();
    await todo.waitForDeployment();
    return { todo, owner, alice, bob };
  }

  describe("Adding", function () {
    it("adds a task and emits TaskAdded", async function () {
      const { todo, alice } = await deploy();
      await expect(todo.connect(alice).addTask("Buy milk"))
        .to.emit(todo, "TaskAdded")
        .withArgs(alice.address, 0, "Buy milk");

      const tasks = await todo.getTasks(alice.address);
      expect(tasks.length).to.equal(1);
      expect(tasks[0].id).to.equal(0n);
      expect(tasks[0].text).to.equal("Buy milk");
      expect(tasks[0].done).to.equal(false);
      expect(tasks[0].createdAt).to.be.gt(0n);
    });

    it("assigns unique, increasing ids", async function () {
      const { todo, alice } = await deploy();
      await todo.connect(alice).addTask("A");
      await todo.connect(alice).addTask("B");
      const tasks = await todo.getTasks(alice.address);
      expect(tasks[0].id).to.equal(0n);
      expect(tasks[1].id).to.equal(1n);
    });

    it("rejects empty text", async function () {
      const { todo, alice } = await deploy();
      await expect(todo.connect(alice).addTask("")).to.be.revertedWith(
        "Text required"
      );
    });

    it("rejects text that is too long", async function () {
      const { todo, alice } = await deploy();
      const long = "x".repeat(257);
      await expect(todo.connect(alice).addTask(long)).to.be.revertedWith(
        "Text too long"
      );
    });
  });

  describe("Per-user isolation", function () {
    it("keeps each wallet's tasks separate", async function () {
      const { todo, alice, bob } = await deploy();
      await todo.connect(alice).addTask("Alice task");
      await todo.connect(bob).addTask("Bob task");

      expect(await todo.taskCount(alice.address)).to.equal(1n);
      expect(await todo.taskCount(bob.address)).to.equal(1n);
      expect((await todo.getTasks(alice.address))[0].text).to.equal("Alice task");
      expect((await todo.getTasks(bob.address))[0].text).to.equal("Bob task");
    });

    it("getMyTasks returns the caller's tasks", async function () {
      const { todo, alice } = await deploy();
      await todo.connect(alice).addTask("Mine");
      const mine = await todo.connect(alice).getMyTasks();
      expect(mine.length).to.equal(1);
      expect(mine[0].text).to.equal("Mine");
    });
  });

  describe("Editing", function () {
    it("edits text and emits TaskEdited", async function () {
      const { todo, alice } = await deploy();
      await todo.connect(alice).addTask("Old");
      await expect(todo.connect(alice).editTask(0, "New"))
        .to.emit(todo, "TaskEdited")
        .withArgs(alice.address, 0, "New");
      expect((await todo.getTasks(alice.address))[0].text).to.equal("New");
    });

    it("rejects a bad index", async function () {
      const { todo, alice } = await deploy();
      await expect(todo.connect(alice).editTask(0, "x")).to.be.revertedWith(
        "Bad index"
      );
    });

    it("rejects empty edit text", async function () {
      const { todo, alice } = await deploy();
      await todo.connect(alice).addTask("Old");
      await expect(todo.connect(alice).editTask(0, "")).to.be.revertedWith(
        "Text required"
      );
    });
  });

  describe("Toggling", function () {
    it("toggles done state and emits TaskToggled", async function () {
      const { todo, alice } = await deploy();
      await todo.connect(alice).addTask("Task");
      await expect(todo.connect(alice).toggleTask(0))
        .to.emit(todo, "TaskToggled")
        .withArgs(alice.address, 0, true);
      expect((await todo.getTasks(alice.address))[0].done).to.equal(true);

      await todo.connect(alice).toggleTask(0);
      expect((await todo.getTasks(alice.address))[0].done).to.equal(false);
    });

    it("rejects a bad index", async function () {
      const { todo, alice } = await deploy();
      await expect(todo.connect(alice).toggleTask(0)).to.be.revertedWith(
        "Bad index"
      );
    });
  });

  describe("Deleting", function () {
    it("deletes a task and emits TaskDeleted", async function () {
      const { todo, alice } = await deploy();
      await todo.connect(alice).addTask("Only");
      await expect(todo.connect(alice).deleteTask(0))
        .to.emit(todo, "TaskDeleted")
        .withArgs(alice.address, 0);
      expect(await todo.taskCount(alice.address)).to.equal(0n);
    });

    it("swap-and-pop: last task fills the deleted slot", async function () {
      const { todo, alice } = await deploy();
      await todo.connect(alice).addTask("A"); // id 0
      await todo.connect(alice).addTask("B"); // id 1
      await todo.connect(alice).addTask("C"); // id 2

      // Delete the first; C should move into index 0.
      await todo.connect(alice).deleteTask(0);
      const tasks = await todo.getTasks(alice.address);
      expect(tasks.length).to.equal(2);
      expect(tasks[0].id).to.equal(2n);
      expect(tasks[0].text).to.equal("C");
      expect(tasks[1].text).to.equal("B");
    });

    it("deleting the last task needs no swap", async function () {
      const { todo, alice } = await deploy();
      await todo.connect(alice).addTask("A");
      await todo.connect(alice).addTask("B");
      await todo.connect(alice).deleteTask(1);
      const tasks = await todo.getTasks(alice.address);
      expect(tasks.length).to.equal(1);
      expect(tasks[0].text).to.equal("A");
    });

    it("rejects a bad index", async function () {
      const { todo, alice } = await deploy();
      await expect(todo.connect(alice).deleteTask(0)).to.be.revertedWith(
        "Bad index"
      );
    });
  });
});
