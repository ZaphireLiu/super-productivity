import { AppDataComplete } from '../../imex/sync/sync.model';
import { createAppDataCompleteMock } from '../../util/app-data-mock';
import { dataRepair } from './data-repair.util';
import { fakeEntityStateFromArray } from '../../util/fake-entity-state-from-array';
import { DEFAULT_TASK, Task } from '../../features/tasks/task.model';
import { createEmptyEntity } from '../../util/create-empty-entity';
import { Tag, TagState } from '../../features/tag/tag.model';
import { ProjectState } from '../../features/project/store/project.reducer';
import { Project } from '../../features/project/project.model';
import { DEFAULT_PROJECT } from '../../features/project/project.const';
import { DEFAULT_TAG } from '../../features/tag/tag.const';

describe('dataRepair()', () => {
  let mock: AppDataComplete;
  beforeEach(() => {
    mock = createAppDataCompleteMock();
  });

  it('should delete tasks with same id in "task" and "taskArchive" from taskArchive', () => {
    const taskState = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'TEST',
        title: 'TEST',
      }])
    } as any;
    expect(dataRepair({
      ...mock,
      task: taskState,
      taskArchive: fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'TEST',
        title: 'TEST',
      }]),
    } as any)).toEqual({
      ...mock,
      task: taskState,
      taskArchive: {
        ...createEmptyEntity()
      },
    });
  });

  it('should delete missing tasks for tags today list', () => {
    const taskState = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'TEST',
        title: 'TEST',
      }])
    } as any;

    const tagState: TagState = {
      ...fakeEntityStateFromArray([{
        title: 'TEST_TAG',
        id: 'TEST_ID_TAG',
        taskIds: ['goneTag', 'TEST', 'noneExisting'],
      }] as Partial<Tag> []),
    };

    expect(dataRepair({
      ...mock,
      tag: tagState,
      task: taskState,
    })).toEqual({
      ...mock,
      task: taskState as any,
      tag: {
        ...tagState,
        entities: {
          TEST_ID_TAG: {
            title: 'TEST_TAG',
            id: 'TEST_ID_TAG',
            taskIds: ['TEST'],
          },
        } as any
      }
    });
  });

  it('should delete missing tasks for projects today list', () => {
    const taskState = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'TEST',
        title: 'TEST',
      }])
    } as any;

    const projectState: ProjectState = {
      ...fakeEntityStateFromArray([{
        title: 'TEST_PROJECT',
        id: 'TEST_ID_PROJECT',
        taskIds: ['goneProject', 'TEST', 'noneExisting'],
        backlogTaskIds: [],
      }] as Partial<Project> []),
    };

    expect(dataRepair({
      ...mock,
      project: projectState,
      task: taskState,
    })).toEqual({
      ...mock,
      task: taskState as any,
      project: {
        ...projectState,
        entities: {
          TEST_ID_PROJECT: {
            title: 'TEST_PROJECT',
            id: 'TEST_ID_PROJECT',
            taskIds: ['TEST'],
            backlogTaskIds: [],
          },
        } as any
      }
    });
  });

  it('should delete missing tasks for projects backlog list', () => {
    const taskState = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'TEST',
        title: 'TEST',
      }])
    } as any;

    const projectState: ProjectState = {
      ...fakeEntityStateFromArray([{
        title: 'TEST_PROJECT',
        id: 'TEST_ID_PROJECT',
        taskIds: [],
        backlogTaskIds: ['goneProject', 'TEST', 'noneExisting'],
      }] as Partial<Project> []),
    };

    expect(dataRepair({
      ...mock,
      project: projectState,
      task: taskState,
    })).toEqual({
      ...mock,
      task: taskState as any,
      project: {
        ...projectState,
        entities: {
          TEST_ID_PROJECT: {
            title: 'TEST_PROJECT',
            id: 'TEST_ID_PROJECT',
            taskIds: [],
            backlogTaskIds: ['TEST'],
          },
        } as any
      }
    });
  });

  describe('should fix duplicate entities for', () => {
    it('task', () => {
      expect(dataRepair({
        ...mock,
        task: {
          ...mock.task,
          ...fakeEntityStateFromArray<Task>([{
            ...DEFAULT_TASK,
            id: 'DUPE',
            title: 'DUPE',
          }, {
            ...DEFAULT_TASK,
            id: 'DUPE',
            title: 'DUPE',
          }, {
            ...DEFAULT_TASK,
            id: 'NO_DUPE',
            title: 'NO_DUPE',
          }])
        } as any,
      })).toEqual({
        ...mock,
        task: {
          ...mock.task,
          ...fakeEntityStateFromArray<Task>([{
            ...DEFAULT_TASK,
            id: 'DUPE',
            title: 'DUPE',
          }, {
            ...DEFAULT_TASK,
            id: 'NO_DUPE',
            title: 'NO_DUPE',
          }])
        } as any,
      });
    });

    it('taskArchive', () => {
      expect(dataRepair({
        ...mock,
        taskArchive: {
          ...mock.taskArchive,
          ...fakeEntityStateFromArray<Task>([{
            ...DEFAULT_TASK,
            id: 'DUPE',
            title: 'DUPE',
          }, {
            ...DEFAULT_TASK,
            id: 'DUPE',
            title: 'DUPE',
          }, {
            ...DEFAULT_TASK,
            id: 'NO_DUPE',
            title: 'NO_DUPE',
          }])
        } as any,
      })).toEqual({
        ...mock,
        taskArchive: {
          ...mock.taskArchive,
          ...fakeEntityStateFromArray<Task>([{
            ...DEFAULT_TASK,
            id: 'DUPE',
            title: 'DUPE',
          }, {
            ...DEFAULT_TASK,
            id: 'NO_DUPE',
            title: 'NO_DUPE',
          }])
        } as any,
      });
    });
  });

  describe('should fix inconsistent entity states for', () => {
    it('task', () => {
      expect(dataRepair({
        ...mock,
        task: {
          ids: ['AAA, XXX', 'YYY'],
          entities: {
            AAA: {...DEFAULT_TASK, id: 'AAA'},
            CCC: {...DEFAULT_TASK, id: 'CCC'},
          }
        } as any,
      })).toEqual({
        ...mock,
        task: {
          ids: ['AAA', 'CCC'],
          entities: {
            AAA: {...DEFAULT_TASK, id: 'AAA'},
            CCC: {...DEFAULT_TASK, id: 'CCC'},
          }
        } as any,
      });
    });
    it('taskArchive', () => {
      expect(dataRepair({
        ...mock,
        taskArchive: {
          ids: ['AAA, XXX', 'YYY'],
          entities: {
            AAA: {...DEFAULT_TASK, id: 'AAA'},
            CCC: {...DEFAULT_TASK, id: 'CCC'},
          }
        } as any,
      })).toEqual({
        ...mock,
        taskArchive: {
          ids: ['AAA', 'CCC'],
          entities: {
            AAA: {...DEFAULT_TASK, id: 'AAA'},
            CCC: {...DEFAULT_TASK, id: 'CCC'},
          }
        } as any,
      });
    });
  });

  it('should restore missing tasks from taskArchive if available', () => {
    const taskArchiveState = {
      ...mock.taskArchive,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'goneToArchiveToday',
        title: 'goneToArchiveToday',
        projectId: 'TEST_ID_PROJECT',
      }, {
        ...DEFAULT_TASK,
        id: 'goneToArchiveBacklog',
        title: 'goneToArchiveBacklog',
        projectId: 'TEST_ID_PROJECT',
      }])
    } as any;

    const projectState: ProjectState = {
      ...fakeEntityStateFromArray([{
        title: 'TEST_PROJECT',
        id: 'TEST_ID_PROJECT',
        taskIds: ['goneToArchiveToday', 'GONE'],
        backlogTaskIds: ['goneToArchiveBacklog', 'GONE'],
      }] as Partial<Project> []),
    };

    expect(dataRepair({
      ...mock,
      project: projectState,
      taskArchive: taskArchiveState,
      task: {
        ...mock.task,
        ...createEmptyEntity()
      } as any,
    })).toEqual({
      ...mock,
      task: {
        ...mock.task,
        ...fakeEntityStateFromArray<Task>([{
          ...DEFAULT_TASK,
          id: 'goneToArchiveToday',
          title: 'goneToArchiveToday',
          projectId: 'TEST_ID_PROJECT',
        }, {
          ...DEFAULT_TASK,
          id: 'goneToArchiveBacklog',
          title: 'goneToArchiveBacklog',
          projectId: 'TEST_ID_PROJECT',
        }])
      } as any,
      project: {
        ...projectState,
        entities: {
          TEST_ID_PROJECT: {
            title: 'TEST_PROJECT',
            id: 'TEST_ID_PROJECT',
            taskIds: ['goneToArchiveToday'],
            backlogTaskIds: ['goneToArchiveBacklog'],
          },
        } as any
      }
    });
  });

  it('should add orphan tasks to their project list', () => {
    const taskState = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'orphanedTask',
        title: 'orphanedTask',
        projectId: 'TEST_ID_PROJECT',
        parentId: null,
      }, {
        ...DEFAULT_TASK,
        id: 'orphanedTaskOtherProject',
        title: 'orphanedTaskOtherProject',
        projectId: 'TEST_ID_PROJECT_OTHER',
        parentId: null,
      }, {
        ...DEFAULT_TASK,
        id: 'regularTaskOtherProject',
        title: 'regularTaskOtherProject',
        projectId: 'TEST_ID_PROJECT_OTHER',
        parentId: null,
      }])
    } as any;

    const projectState: ProjectState = {
      ...fakeEntityStateFromArray([{
        title: 'TEST_PROJECT',
        id: 'TEST_ID_PROJECT',
        taskIds: ['GONE'],
        backlogTaskIds: [],
      }, {
        title: 'TEST_PROJECT_OTHER',
        id: 'TEST_ID_PROJECT_OTHER',
        taskIds: ['regularTaskOtherProject'],
        backlogTaskIds: [],
      }] as Partial<Project> []),
    };

    expect(dataRepair({
      ...mock,
      project: projectState,
      task: taskState,
    })).toEqual({
      ...mock,
      task: taskState,
      project: {
        ...projectState,
        entities: {
          TEST_ID_PROJECT: {
            title: 'TEST_PROJECT',
            id: 'TEST_ID_PROJECT',
            taskIds: ['orphanedTask'],
            backlogTaskIds: [],
          },
          TEST_ID_PROJECT_OTHER: {
            title: 'TEST_PROJECT_OTHER',
            id: 'TEST_ID_PROJECT_OTHER',
            taskIds: ['regularTaskOtherProject', 'orphanedTaskOtherProject'],
            backlogTaskIds: [],
          },
        } as any
      }
    });
  });

  it('should move archived sub tasks back to their unarchived parents', () => {
    const taskStateBefore = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'subTaskUnarchived',
        title: 'subTaskUnarchived',
        parentId: 'parent',
      }, {
        ...DEFAULT_TASK,
        id: 'parent',
        title: 'parent',
        parentId: null,
        subTaskIds: ['subTaskUnarchived']
      }])
    } as any;

    const taskArchiveStateBefore = {
      ...mock.taskArchive,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'subTaskArchived',
        title: 'subTaskArchived',
        parentId: 'parent',
      }])
    } as any;

    expect(dataRepair({
      ...mock,
      task: taskStateBefore,
      taskArchive: taskArchiveStateBefore,
    })).toEqual({
      ...mock,
      task: {
        ...mock.task,
        ...fakeEntityStateFromArray<Task>([{
          ...DEFAULT_TASK,
          id: 'subTaskUnarchived',
          title: 'subTaskUnarchived',
          parentId: 'parent',
        }, {
          ...DEFAULT_TASK,
          id: 'parent',
          title: 'parent',
          parentId: null,
          subTaskIds: ['subTaskUnarchived', 'subTaskArchived'],
        }, {
          ...DEFAULT_TASK,
          id: 'subTaskArchived',
          title: 'subTaskArchived',
          parentId: 'parent',
        }])
      } as any,
      taskArchive: {
        ...mock.taskArchive,
        ...fakeEntityStateFromArray<Task>([])
      } as any,
    });
  });

  it('should move unarchived sub tasks to their archived parents', () => {
    const taskStateBefore = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'subTaskUnarchived',
        title: 'subTaskUnarchived',
        parentId: 'parent',
      }])
    } as any;

    const taskArchiveStateBefore = {
      ...mock.taskArchive,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'subTaskArchived',
        title: 'subTaskArchived',
        parentId: 'parent',
      }, {
        ...DEFAULT_TASK,
        id: 'parent',
        title: 'parent',
        parentId: null,
        subTaskIds: ['subTaskArchived']
      }])
    } as any;

    expect(dataRepair({
      ...mock,
      task: taskStateBefore,
      taskArchive: taskArchiveStateBefore,
    })).toEqual({
      ...mock,
      task: {
        ...mock.task,
        ...fakeEntityStateFromArray<Task>([])
      } as any,
      taskArchive: {
        ...mock.taskArchive,
        ...fakeEntityStateFromArray<Task>([{
          ...DEFAULT_TASK,
          id: 'subTaskArchived',
          title: 'subTaskArchived',
          parentId: 'parent',
        }, {
          ...DEFAULT_TASK,
          id: 'parent',
          title: 'parent',
          parentId: null,
          subTaskIds: ['subTaskArchived', 'subTaskUnarchived']
        }, {
          ...DEFAULT_TASK,
          id: 'subTaskUnarchived',
          title: 'subTaskUnarchived',
          parentId: 'parent',
        }])
      } as any,
    });
  });

  it('should assign task projectId according to parent', () => {
    const project = {
      ...mock.project,
      ...fakeEntityStateFromArray<Project>([{
        ...DEFAULT_PROJECT,
        id: 'p1',
      }])
    } as any;

    const taskStateBefore = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'subTask1',
        title: 'subTask1',
        projectId: null,
        parentId: 'parent',
      }, {
        ...DEFAULT_TASK,
        id: 'subTask2',
        title: 'subTask2',
        projectId: null,
        parentId: 'parent',
      }, {
        ...DEFAULT_TASK,
        id: 'parent',
        title: 'parent',
        parentId: null,
        projectId: 'p1',
        subTaskIds: ['subTask1', 'subTask2'],
      }])
    } as any;

    expect(dataRepair({
      ...mock,
      project,
      task: taskStateBefore,
    })).toEqual({
      ...mock,
      project,
      task: {
        ...mock.task,
        ...fakeEntityStateFromArray<Task>([{
          ...DEFAULT_TASK,
          id: 'subTask1',
          title: 'subTask1',
          parentId: 'parent',
          projectId: 'p1',
        }, {
          ...DEFAULT_TASK,
          id: 'subTask2',
          title: 'subTask2',
          parentId: 'parent',
          projectId: 'p1',
        }, {
          ...DEFAULT_TASK,
          id: 'parent',
          title: 'parent',
          parentId: null,
          subTaskIds: ['subTask1', 'subTask2'],
          projectId: 'p1',
        }])
      } as any,
    });
  });

  it('should delete non-existent project ids for tasks in "task"', () => {
    const taskState = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'TEST',
        title: 'TEST',
        projectId: 'NON_EXISTENT'
      }])
    } as any;

    expect(dataRepair({
      ...mock,
      task: taskState,
    } as any)).toEqual({
      ...mock,
      task: {
        ...taskState,
        entities: {
          TEST: {
            ...taskState.entities.TEST,
            projectId: null
          }
        }
      },
    });
  });

  it('should delete non-existent project ids for tasks in "taskArchive"', () => {
    const taskArchiveState = {
      ...mock.taskArchive,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'TEST',
        title: 'TEST',
        projectId: 'NON_EXISTENT'
      }])
    } as any;

    expect(dataRepair({
      ...mock,
      taskArchive: taskArchiveState,
    } as any)).toEqual({
      ...mock,
      taskArchive: {
        ...taskArchiveState,
        entities: {
          TEST: {
            ...taskArchiveState.entities.TEST,
            projectId: null
          }
        }
      },
    });
  });

  it('should remove from project list if task has wrong project id', () => {
    const project = {
      ...mock.project,
      ...fakeEntityStateFromArray<Project>([{
        ...DEFAULT_PROJECT,
        id: 'p1',
        taskIds: ['t1', 't2']
      }, {
        ...DEFAULT_PROJECT,
        id: 'p2',
        taskIds: ['t1']
      }])
    } as any;

    const task = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 't1',
        projectId: 'p1'
      }, {
        ...DEFAULT_TASK,
        id: 't2',
        projectId: 'p1'
      }])
    } as any;

    expect(dataRepair({
      ...mock,
      project,
      task,
    })).toEqual({
      ...mock,
      project: {
        ...project,
        ...fakeEntityStateFromArray<Project>([{
          ...DEFAULT_PROJECT,
          id: 'p1',
          taskIds: ['t1', 't2']
        }, {
          ...DEFAULT_PROJECT,
          id: 'p2',
          taskIds: []
        }])
      },
      task,
    });
  });

  it('should move to project if task has no projectId', () => {
    const project = {
      ...mock.project,
      ...fakeEntityStateFromArray<Project>([{
        ...DEFAULT_PROJECT,
        id: 'p1',
        taskIds: ['t1', 't2']
      }])
    } as any;

    const task = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 't1',
        projectId: 'p1'
      }, {
        ...DEFAULT_TASK,
        id: 't2',
        projectId: null
      }])
    } as any;

    expect(dataRepair({
      ...mock,
      project,
      task,
    })).toEqual({
      ...mock,
      project,
      task: {
        ...mock.task,
        ...fakeEntityStateFromArray<Task>([{
          ...DEFAULT_TASK,
          id: 't1',
          projectId: 'p1'
        }, {
          ...DEFAULT_TASK,
          id: 't2',
          projectId: 'p1'
        }])
      } as any,
    });
  });

  it('should move to project if backlogTask has no projectId', () => {
    const project = {
      ...mock.project,
      ...fakeEntityStateFromArray<Project>([{
        ...DEFAULT_PROJECT,
        id: 'p1',
        backlogTaskIds: ['t1', 't2']
      }])
    } as any;

    const task = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 't1',
        projectId: 'p1'
      }, {
        ...DEFAULT_TASK,
        id: 't2',
        projectId: null
      }])
    } as any;

    expect(dataRepair({
      ...mock,
      project,
      task,
    })).toEqual({
      ...mock,
      project,
      task: {
        ...mock.task,
        ...fakeEntityStateFromArray<Task>([{
          ...DEFAULT_TASK,
          id: 't1',
          projectId: 'p1'
        }, {
          ...DEFAULT_TASK,
          id: 't2',
          projectId: 'p1'
        }])
      } as any,
    });
  });

  it('should add tagId to task if listed, but task does not contain it', () => {
    const tag = {
      ...mock.tag,
      ...fakeEntityStateFromArray<Tag>([{
        ...DEFAULT_TAG,
        id: 'tag1',
        taskIds: ['task1', 'task2']
      }])
    } as any;

    const task = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'task1',
        tagIds: ['tag1']
      }, {
        ...DEFAULT_TASK,
        id: 'task2',
        tagIds: []
      }])
    } as any;

    expect(dataRepair({
      ...mock,
      tag,
      task,
    })).toEqual({
      ...mock,
      tag,
      task: {
        ...mock.task,
        ...fakeEntityStateFromArray<Task>([{
          ...DEFAULT_TASK,
          id: 'task1',
          tagIds: ['tag1']
        }, {
          ...DEFAULT_TASK,
          id: 'task2',
          tagIds: ['tag1']
        }])
      } as any,
    });
  });

  it('should cleanup orphaned sub tasks', () => {
    const task = {
      ...mock.task,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'task1',
        subTaskIds: ['s1', 's2GONE']
      }, {
        ...DEFAULT_TASK,
        id: 's1',
        parentId: 'task1',
      }]),
    } as any;

    const taskArchive = {
      ...mock.taskArchive,
      ...fakeEntityStateFromArray<Task>([{
        ...DEFAULT_TASK,
        id: 'archiveTask1',
        subTaskIds: ['as1', 'as2GONE']
      }, {
        ...DEFAULT_TASK,
        id: 'as1',
        parentId: 'archiveTask1',
      }]),
    } as any;

    expect(dataRepair({
      ...mock,
      task,
      taskArchive,
    })).toEqual({
      ...mock,
      task: {
        ...mock.task,
        ...fakeEntityStateFromArray<Task>([{
          ...DEFAULT_TASK,
          id: 'task1',
          subTaskIds: ['s1']
        }, {
          ...DEFAULT_TASK,
          id: 's1',
          parentId: 'task1',
        }]),
      } as any,
      taskArchive: {
        ...mock.taskArchive,
        ...fakeEntityStateFromArray<Task>([{
          ...DEFAULT_TASK,
          id: 'archiveTask1',
          subTaskIds: ['as1']
        }, {
          ...DEFAULT_TASK,
          id: 'as1',
          parentId: 'archiveTask1',
        }]),
      } as any
    });
  });
});
