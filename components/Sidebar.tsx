'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, FileText, Plus, Menu, LogIn, UserPlus, LogOut, Settings, ChevronLeft } from "lucide-react";
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
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-4 border-b bg-white md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="mr-2"
        >
          {isMobileSidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
        <h1 className="text-lg font-semibold">1Resume</h1>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "flex flex-col h-full",
        "md:top-0",
        !isMobileSidebarOpen && "md:block"
      )}>
        {/* Header */}
        <div className="flex flex-col flex-shrink-0">
          <div className="h-14 flex items-center px-4 border-b border-gray-200 md:justify-between">
            <h2 className="text-lg font-semibold hidden md:block">1Resume</h2>
          </div>
          <div className="p-4">
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={onUploadClick}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Resume
            </Button>
          </div>
        </div>
        
        {/* Resumes List */}
        <ScrollArea className="flex-1 px-3 py-2">
          <div className="space-y-1">
            {storedFiles.length === 0 ? (
              <div className="px-2 py-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  No resumes yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Upload your first resume to get started
                </p>
              </div>
            ) : (
              storedFiles.map((file) => (
                <div
                  key={file}
                  onClick={() => onFileSelect(file)}
                  className={cn(
                    "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
                    "hover:bg-gray-100",
                    currentFile === file ? "bg-gray-100" : ""
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

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200">
          {user ? (
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-emerald-600">
                      {user.email?.[0].toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {user.email}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-700"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => openAuthModal('signin')}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
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
