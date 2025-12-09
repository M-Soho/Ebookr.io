"use client"

import * as Dialog from '@radix-ui/react-dialog'
import React from 'react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export default function Modal({ open, onOpenChange, children, className = '' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={
            'fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ' +
            'opacity-0 data-[state=open]:opacity-100'
          }
        />

        <Dialog.Content
          className={
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 ' +
            'rounded-lg bg-white shadow-xl p-0 transition-all duration-200 opacity-0 scale-95 ' +
            'data-[state=open]:opacity-100 data-[state=open]:scale-100 ' +
            className
          }
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
