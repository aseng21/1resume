import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { texDoc, opts } = await req.json();

    if (!texDoc) {
      return NextResponse.json({ error: 'No LaTeX document provided' }, { status: 400 });
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'latex-'));
    const texFilePath = path.join(tempDir, 'resume.tex');
    const pdfFilePath = path.join(tempDir, 'resume.pdf');

    await fs.writeFile(texFilePath, texDoc, 'utf8');

    try {
      await execAsync(`cd "${tempDir}" && pdflatex -interaction=nonstopmode resume.tex`);

      await execAsync(`cd "${tempDir}" && pdflatex -interaction=nonstopmode resume.tex`);

      const pdfContent = await fs.readFile(pdfFilePath);
      const base64Pdf = pdfContent.toString('base64');

      await fs.rm(tempDir, { recursive: true, force: true });

      return NextResponse.json({ pdf: base64Pdf });
    } catch (error: any) {
      console.error('LaTeX compilation error:', error);
      
      try {
        const logPath = path.join(tempDir, 'resume.log');
        const logContent = await fs.readFile(logPath, 'utf8');
        const errorLines = logContent
          .split('\n')
          .filter(line => line.includes('!') || line.includes('Error'))
          .join('\n');
        
        return NextResponse.json(
          { error: 'LaTeX compilation failed', details: errorLines },
          { status: 500 }
        );
      } catch (logError) {
        return NextResponse.json(
          { error: 'LaTeX compilation failed', details: error.message },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}
