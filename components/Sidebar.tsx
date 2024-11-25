'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Plus, Menu, LogIn, UserPlus, LogOut, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { listStoredPDFs, extractOriginalFilename } from '@/lib/pdfStorage';
import { cn } from "@/lib/utils";
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import AuthModal from './AuthModal';

interface SidebarProps {
  onFileSelect: (file: string) => void;
  onDelete: (file: string) => void;
  currentFile: string | null;
  onUploadClick: () => void;
  onSidebarToggle?: (isOpen: boolean) => void;
}

export default function Sidebar({ onFileSelect, onDelete, currentFile, onUploadClick, onSidebarToggle }: SidebarProps) {
  const [storedFiles, setStoredFiles] = useState<string[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  useEffect(() => {
    loadStoredFiles();
  }, [currentFile]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    onSidebarToggle?.(isDesktopSidebarOpen);
  }, [isDesktopSidebarOpen, onSidebarToggle]);

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

  const openAuthModal = (mode: 'signin' | 'signup' | 'reset') => {
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

      {/* Toggle button for desktop */}
      <button
        onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
        className={cn(
          "fixed top-[14px] z-50 hidden md:flex items-center justify-center",
          "h-6 w-6 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]",
          "hover:shadow-[0_2px_5px_rgba(0,0,0,0.15)] transition-all duration-200",
          isDesktopSidebarOpen ? "left-[266px]" : "left-0",
          isDesktopSidebarOpen ? "-translate-x-1/2" : "translate-x-1/2"
        )}
      >
        <svg
          className="w-4 h-4 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          {isDesktopSidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.5 12h-13m7-7l-7 7 7 7"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.5 12h13m-7-7l7 7-7 7"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
        !isDesktopSidebarOpen && "md:-translate-x-full",
        "flex flex-col h-full"
      )}>
        {/* Header */}
        <div className="flex flex-col h-full">
          <div className="h-14 flex items-center px-4 border-b border-gray-200 md:justify-between">
            <h2 className="text-lg font-semibold hidden md:block">1Resume</h2>
          </div>
          <div className="p-4">
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={onUploadClick}
            >
              <Plus className="mr-2 h-4 w-4" /> Choose PDF File
            </Button>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto px-4">
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
                  className={cn(
                    "group flex items-center w-full p-2 rounded-lg mb-2 relative pr-12",
                    currentFile === file 
                      ? "bg-gray-100" 
                      : "hover:bg-gray-50"
                  )}
                >
                  <div 
                    className="flex-1 flex items-center cursor-pointer min-w-0"
                    onClick={() => onFileSelect(file)}
                  >
                    <FileText className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                    <span className="truncate text-gray-700">
                      {extractOriginalFilename(file)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file, e);
                    }}
                    className="absolute right-2 flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto border-t border-gray-200 bg-white">
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
