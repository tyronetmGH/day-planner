import { describe, it, expect } from 'vitest'
import type { Task, TaskFormData, ValidationError } from './index'

describe('TypeScript interfaces', () => {
  it('should define Task interface correctly', () => {
    const task: Task = {
      id: '123',
      time: '09:30',
      title: 'Test task',
      priority: 'high',
      createdAt: Date.now()
    }
    
    expect(task.id).toBe('123')
    expect(task.time).toBe('09:30')
    expect(task.title).toBe('Test task')
    expect(task.priority).toBe('high')
    expect(typeof task.createdAt).toBe('number')
  })

  it('should define TaskFormData interface correctly', () => {
    const formData: TaskFormData = {
      time: '14:30',
      title: 'Form test',
      priority: 'medium'
    }
    
    expect(formData.time).toBe('14:30')
    expect(formData.title).toBe('Form test')
    expect(formData.priority).toBe('medium')
  })

  it('should define ValidationError interface correctly', () => {
    const error: ValidationError = {
      field: 'time',
      message: 'Invalid time format'
    }
    
    expect(error.field).toBe('time')
    expect(error.message).toBe('Invalid time format')
  })
})