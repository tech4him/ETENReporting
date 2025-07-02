'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { debounce } from 'lodash'

export interface AutoSaveOptions {
  delay?: number
  onSave: (data: any) => Promise<void>
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}

export interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  error: string | null
}

export function useAutoSave<T>(initialData: T, options: AutoSaveOptions) {
  const {
    delay = 2000, // 2 second delay
    onSave,
    onSaveSuccess,
    onSaveError
  } = options

  const [data, setData] = useState<T>(initialData)
  const [saveState, setSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null
  })

  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedDataRef = useRef<T>(initialData)

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (dataToSave: T) => {
      try {
        setSaveState(prev => ({ ...prev, isSaving: true, error: null }))
        await onSave(dataToSave)
        
        lastSavedDataRef.current = dataToSave
        setSaveState(prev => ({
          ...prev,
          isSaving: false,
          lastSaved: new Date(),
          hasUnsavedChanges: false,
          error: null
        }))
        
        onSaveSuccess?.()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Auto-save failed'
        setSaveState(prev => ({
          ...prev,
          isSaving: false,
          error: errorMessage
        }))
        onSaveError?.(error instanceof Error ? error : new Error(errorMessage))
      }
    }, delay),
    [delay, onSave, onSaveSuccess, onSaveError]
  )

  // Update data and trigger auto-save
  const updateData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setData(prevData => {
      const newData = typeof updates === 'function' ? updates(prevData) : { ...prevData, ...updates }
      
      // Check if data actually changed
      const hasChanges = JSON.stringify(newData) !== JSON.stringify(lastSavedDataRef.current)
      
      if (hasChanges) {
        setSaveState(prev => ({ ...prev, hasUnsavedChanges: true, error: null }))
        debouncedSave(newData)
      }
      
      return newData
    })
  }, [debouncedSave])

  // Manual save function
  const saveNow = useCallback(async () => {
    debouncedSave.cancel() // Cancel any pending auto-save
    try {
      setSaveState(prev => ({ ...prev, isSaving: true, error: null }))
      await onSave(data)
      
      lastSavedDataRef.current = data
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        error: null
      }))
      
      onSaveSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed'
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage
      }))
      onSaveError?.(error instanceof Error ? error : new Error(errorMessage))
      throw error
    }
  }, [data, onSave, onSaveSuccess, onSaveError, debouncedSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel()
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [debouncedSave])

  return {
    data,
    updateData,
    saveNow,
    ...saveState
  }
}

// Helper function to create field updaters
export function createFieldUpdater<T>(
  updateData: (updates: Partial<T>) => void,
  fieldName: keyof T
) {
  return (value: T[keyof T]) => {
    updateData({ [fieldName]: value } as Partial<T>)
  }
}