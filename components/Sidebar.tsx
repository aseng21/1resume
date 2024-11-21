'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, FileText, Plus, Menu, LogIn, UserPlus, LogOut } from "lucide-react";
import { listStoredPDFs } from '@/lib/pdfStorage';
import { cn } from "@/lib/utils";
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import AuthModal from './AuthModal';

interface SidebarProps {
  onFileSelect: (file: string) => void;
  onDelete: (file: string) => void;
  currentFile: string | null;
  onUploadClick: () => void;
}

export default function Sidebar({ onFileSelect, onDelete, currentFile, onUploadClick }: SidebarProps) {
  const [storedFiles, setStoredFiles] = useState<string[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    loadStoredFiles();
  }, [currentFile]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const loadStoredFiles = async () => {
    try {
      const files = await listStoredPDFs();
      setStoredFiles(files);
    } catch (error) {
      console.error('Error loading stored files:', error);
    }
  };

  const handleDelete = async (file: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await onDelete(file);
    await loadStoredFiles();
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 md:hidden z-50"
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "flex flex-col h-full"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">1Resume</h2>
          </div>
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onUploadClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Resume
          </Button>
        </div>
        
        {/* Resumes List */}
        <ScrollArea className="flex-1 px-2 py-4">
          <div className="space-y-1">
            {storedFiles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No resumes stored yet
              </p>
            ) : (
              storedFiles.map((file) => (
                <div
                  key={file}
                  onClick={() => onFileSelect(file)}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all",
                    "hover:bg-emerald-50",
                    currentFile === file ? "bg-emerald-50 border-emerald-200" : ""
                  )}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <FileText className={cn(
                      "h-4 w-4 flex-shrink-0",
                      currentFile === file ? "text-emerald-600" : "text-gray-400"
                    )} />
                    <span className={cn(
                      "text-sm truncate",
                      currentFile === file ? "text-emerald-600 font-medium" : "text-gray-600"
                    )}>
                      {file.split('-').pop()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(file, e)}
                  >
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Auth Section */}
        <div className="p-4 border-t border-gray-200">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-emerald-600">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-xs text-gray-500">{user.email}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                onClick={() => openAuthModal('signin')}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-600 hover:bg-gray-50"
                onClick={() => openAuthModal('signup')}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create account
              </Button>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  );
}
