import { expect } from "jsr:@std/expect";
import './editor_api.ts'

export const expectOutputForInput = async (module: () => void | Promise<void>, input: string, expectedOutput: string) => {
    // @ts-ignore
    globalThis.editorMock = {
        fullText: input,
        error: undefined,
    }

    await module()
    
    // @ts-ignore
    expect(globalThis.editorMock.fullText).toBe(expectedOutput)
    // @ts-ignore
    expect(globalThis.editorMock.error).toBe(undefined)
}

export const expectInputGivesError = async (module: () => void | Promise<void>, input: string, expectedErrorOutput: string) => {
    // @ts-ignore
    globalThis.editorMock = {
        fullText: input,
        error: undefined,
    }

    await module()
    
    // @ts-ignore
    expect(globalThis.editorMock.fullText).toBe(input)
    // @ts-ignore
    expect(globalThis.editorMock.error).toBe(expectedErrorOutput)
}