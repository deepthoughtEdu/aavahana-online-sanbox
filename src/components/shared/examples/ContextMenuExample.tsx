// src/components/examples/ContextMenuExample.tsx
'use client';

import React, { useState } from 'react';
import { useContextMenu, MenuOption } from '@/lib/hooks/shared/use-context-menu';
import { Copy, Trash2, Edit, Share2, Mail, Link as LinkIcon, Download, FileText } from 'lucide-react';

/**
 * Example component demonstrating the useContextMenu hook
 * 
 * This component shows various use cases:
 * - Basic right-click menu
 * - Options with icons
 * - Disabled options
 * - Danger options (delete)
 * - Dividers
 * - Keyboard shortcuts display
 * - Submenu support
 */
export function ContextMenuExample() {
  const [clipboardHasContent, setClipboardHasContent] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');
  
  // Handler functions
  const handleCopy = () => {
    setLastAction('Copied to clipboard');
    setClipboardHasContent(true);
  };
  
  const handlePaste = () => {
    setLastAction('Pasted from clipboard');
  };
  
  const handleEdit = () => {
    setLastAction('Edit initiated');
  };
  
  const handleDelete = () => {
    setLastAction('Item deleted');
  };
  
  const handleDownload = () => {
    setLastAction('Download started');
  };
  
  const handleShareEmail = () => {
    setLastAction('Shared via email');
  };
  
  const handleShareLink = () => {
    setLastAction('Link copied to clipboard');
    setClipboardHasContent(true);
  };
  
  // Define menu options
  const menuOptions: MenuOption[] = [
    {
      value: 'copy',
      label: 'Copy',
      icon: <Copy size={16} />,
      callback: handleCopy,
      shortcut: 'Ctrl+C',
    },
    {
      value: 'paste',
      label: 'Paste',
      icon: <FileText size={16} />,
      callback: handlePaste,
      disabled: !clipboardHasContent,
      shortcut: 'Ctrl+V',
    },
    {}, // Divider
    {
      value: 'edit',
      label: 'Edit',
      icon: <Edit size={16} />,
      callback: handleEdit,
      shortcut: 'Ctrl+E',
    },
    {
      value: 'share',
      label: 'Share',
      icon: <Share2 size={16} />,
      submenu: [
        {
          value: 'share-email',
          label: 'Email',
          icon: <Mail size={16} />,
          callback: handleShareEmail,
        },
        {
          value: 'share-link',
          label: 'Copy Link',
          icon: <LinkIcon size={16} />,
          callback: handleShareLink,
        },
      ],
    },
    {
      value: 'download',
      label: 'Download',
      icon: <Download size={16} />,
      callback: handleDownload,
      shortcut: 'Ctrl+D',
    },
    {}, // Divider
    {
      value: 'delete',
      label: 'Delete',
      icon: <Trash2 size={16} />,
      callback: handleDelete,
      danger: true,
      shortcut: 'Del',
    },
  ];
  
  // Initialize context menu hook
  const { openContextMenu, ContextMenuComponent } = useContextMenu({
    options: menuOptions,
    theme: 'auto',
  });
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Context Menu Example
        </h2>
        <p className="text-neutral">
          Right-click on any card below to see the context menu in action
        </p>
      </div>
      
      {/* Action feedback */}
      {lastAction && (
        <div className="alert alert-info">
          <span>Last action: {lastAction}</span>
          <button 
            className="btn btn-sm btn-ghost"
            onClick={() => setLastAction('')}
          >
            Clear
          </button>
        </div>
      )}
      
      {/* Demo cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div
          className="card bg-white border border-base-300 shadow-sm hover:shadow-md transition-shadow cursor-context-menu"
          onContextMenu={openContextMenu}
        >
          <div className="card-body">
            <h3 className="card-title text-base">Document 1</h3>
            <p className="text-sm text-neutral">
              Right-click to see menu options
            </p>
            <div className="badge badge-primary badge-sm">Active</div>
          </div>
        </div>
        
        {/* Card 2 */}
        <div
          className="card bg-white border border-base-300 shadow-sm hover:shadow-md transition-shadow cursor-context-menu"
          onContextMenu={openContextMenu}
        >
          <div className="card-body">
            <h3 className="card-title text-base">Document 2</h3>
            <p className="text-sm text-neutral">
              Supports keyboard navigation with arrow keys
            </p>
            <div className="badge badge-secondary badge-sm">Draft</div>
          </div>
        </div>
        
        {/* Card 3 */}
        <div
          className="card bg-white border border-base-300 shadow-sm hover:shadow-md transition-shadow cursor-context-menu"
          onContextMenu={openContextMenu}
        >
          <div className="card-body">
            <h3 className="card-title text-base">Document 3</h3>
            <p className="text-sm text-neutral">
              Press ESC to close menu
            </p>
            <div className="badge badge-accent badge-sm">Archived</div>
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body">
          <h3 className="card-title text-lg">Features Demonstrated</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-black/80">
            <li>Right-click detection and menu positioning</li>
            <li>Icons and keyboard shortcuts display</li>
            <li>Disabled options (Paste is disabled until you Copy)</li>
            <li>Danger styling (Delete option in red)</li>
            <li>Dividers for visual separation</li>
            <li>Submenu support (Share option)</li>
            <li>Keyboard navigation (Arrow keys, Enter, ESC)</li>
            <li>Click-away to close</li>
            <li>Viewport boundary detection</li>
          </ul>
        </div>
      </div>
      
      {/* Keyboard shortcuts reference */}
      <div className="card bg-white border border-base-300">
        <div className="card-body">
          <h3 className="card-title text-lg">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <kbd className="kbd kbd-sm">↑/↓</kbd>
              <span className="ml-2 text-neutral">Navigate</span>
            </div>
            <div>
              <kbd className="kbd kbd-sm">Enter</kbd>
              <span className="ml-2 text-neutral">Select</span>
            </div>
            <div>
              <kbd className="kbd kbd-sm">ESC</kbd>
              <span className="ml-2 text-neutral">Close</span>
            </div>
            <div>
              <kbd className="kbd kbd-sm">→</kbd>
              <span className="ml-2 text-neutral">Open submenu</span>
            </div>
            <div>
              <kbd className="kbd kbd-sm">←</kbd>
              <span className="ml-2 text-neutral">Close submenu</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Render the context menu */}
      {ContextMenuComponent}
    </div>
  );
}
