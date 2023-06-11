import { ID, databases, storage } from "@/appwrite"
import { getTodosGroupedByColumn } from "@/lib/getTodosGroupedByColumn"
import uploadImage from "@/lib/uploadImage"
import { create } from "zustand"

interface BoardState {
  board: Board
  getBoard: () => void
  setBoardState: (board: Board) => void
  updateTodoInDB: (todo: Todo, columnId: TypedColumn) => void

  newTaskInput: string
  setNewTaskInput: (newTaskInput: string) => void

  newTaskType: TypedColumn
  setNewTaskType: (columnId: TypedColumn) => void

  image: File | null
  setImage: (image: File | null) => void

  searchstring: string
  setSearchString: (searchstring: string) => void

  addTask: (todo: string, columnId: TypedColumn, image?: File | null) => void

  deleteTask: (taskIndex: number, todo: Todo, id: TypedColumn) => void
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: {
    columns: new Map<TypedColumn, Column>(),
  },

  newTaskInput: "",
  setNewTaskInput: (newTaskInput: string) => set({ newTaskInput }),

  newTaskType: "todo",
  setNewTaskType: (newTaskType: TypedColumn) => set({ newTaskType }),

  image: null,
  setImage: (image: File | null) => set({ image }),

  searchstring: "",
  setSearchString: (searchstring: string) => set({ searchstring }),

  getBoard: async () => {
    const board = await getTodosGroupedByColumn()
    set({ board })
  },

  setBoardState: (board) => set({ board }),

  deleteTask: async (taskIndex: number, todo: Todo, id: TypedColumn) => {
    const newColumns = new Map(get().board.columns)

    newColumns.get(id)?.todos.splice(taskIndex, 1)

    set({ board: { columns: newColumns } })

    if (todo.image) {
      await storage.deleteFile(todo.image.bucketId, todo.image.fileId)
    }

    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
      todo.$id
    )
  },

  updateTodoInDB: async (todo, columnId) => {
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
      todo.$id,
      {
        title: todo.title,
        status: columnId,
      }
    )
  },

  addTask: async (todo: string, columnId: TypedColumn, image?: File | null) => {
    let file: Image | undefined

    if (image) {
      const fileUpload = await uploadImage(image)
      if (fileUpload) {
        file = {
          bucketId: fileUpload.bucketId,
          fileId: fileUpload.$id,
        }
      }
    }

    const { $id } = await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
      ID.unique(),
      {
        title: todo,
        status: columnId,
        ...(file && { image: JSON.stringify(file) }),
      }
    )

    set({ newTaskInput: "" })

    set((state) => {
      const newColumns = new Map(state.board.columns)

      const newTodo: Todo = {
        $id,
        $createdAt: new Date().toISOString(),
        title: todo,
        status: columnId,
        ...(file && { image: file }),
      }

      const column = newColumns.get(columnId)

      if (!column) {
        newColumns.set(columnId, {
          id: columnId,
          todos: [newTodo],
        })
      } else {
        newColumns.get(columnId)?.todos.push(newTodo)
      }

      return {
        board: {
          columns: newColumns,
        },
      }
    })
  },
}))
