declare global {
    const Editor: {
        getFullText: () => Promise<string>,
        setFullText: (fullText: string) => Promise<void>,
        setError: (error: string) => Promise<void>,
    }
}

export {}