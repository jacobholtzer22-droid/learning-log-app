'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { BottomNav } from '../../Components/BottomNav'
import { BackButton } from '../../Components/BackButton'
import { Spinner } from '../../Components/Spinner'
import { useToast } from '../../Components/Toast'

interface ImportedBook {
  title: string
  creator: string
  consumedDate: string
  rating: number | null
  selected: boolean
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importedBooks, setImportedBooks] = useState<ImportedBook[]>([])
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const router = useRouter()
  const { showToast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const parseCSV = (text: string): ImportedBook[] => {
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    
    // Find column indexes (Goodreads format)
    const titleIndex = headers.findIndex(h => h.includes('title'))
    const authorIndex = headers.findIndex(h => h.includes('author'))
    const dateReadIndex = headers.findIndex(h => h.includes('date read') || h.includes('dateread'))
    const dateAddedIndex = headers.findIndex(h => h.includes('date added') || h.includes('dateadded'))
    const ratingIndex = headers.findIndex(h => h.includes('my rating') || h.includes('rating'))
    
    const books: ImportedBook[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue
      
      // Handle CSV with quoted fields
      const values: string[] = []
      let current = ''
      let inQuotes = false
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      
      const title = titleIndex >= 0 ? values[titleIndex]?.replace(/"/g, '') : ''
      const author = authorIndex >= 0 ? values[authorIndex]?.replace(/"/g, '') : ''
      const dateRead = dateReadIndex >= 0 ? values[dateReadIndex]?.replace(/"/g, '') : ''
      const dateAdded = dateAddedIndex >= 0 ? values[dateAddedIndex]?.replace(/"/g, '') : ''
      const ratingStr = ratingIndex >= 0 ? values[ratingIndex]?.replace(/"/g, '') : ''
      const rating = ratingStr ? parseInt(ratingStr) : null
      
      if (title) {
        books.push({
          title,
          creator: author,
          consumedDate: dateRead || dateAdded || new Date().toISOString().split('T')[0],
          rating: rating && rating > 0 ? rating : null,
          selected: true,
        })
      }
    }
    
    return books
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setParsing(true)
    
    try {
      const text = await selectedFile.text()
      const books = parseCSV(text)
      
      if (books.length === 0) {
        showToast('No books found in file. Make sure it has Title and Author columns.', 'error')
        setParsing(false)
        return
      }
      
      setImportedBooks(books)
      setStep('preview')
    } catch (err) {
      showToast('Failed to parse file', 'error')
    }
    
    setParsing(false)
  }

  const toggleBook = (index: number) => {
    setImportedBooks(books => 
      books.map((book, i) => 
        i === index ? { ...book, selected: !book.selected } : book
      )
    )
  }

  const toggleAll = () => {
    const allSelected = importedBooks.every(b => b.selected)
    setImportedBooks(books => 
      books.map(book => ({ ...book, selected: !allSelected }))
    )
  }

  const getStarDisplay = (rating: number | null) => {
    if (!rating) return ''
    return '⭐'.repeat(rating)
  }

  const handleImport = async () => {
    const selectedBooks = importedBooks.filter(b => b.selected)
    if (selectedBooks.length === 0) {
      showToast('Select at least one book to import', 'error')
      return
    }

    setImporting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast('Please log in to import', 'error')
      setImporting(false)
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const book of selectedBooks) {
      // Build key points with rating if available
      let keyPoints = 'Imported - add your key points'
      if (book.rating) {
        keyPoints = `${getStarDisplay(book.rating)} (${book.rating}/5 stars)\n\nAdd your key points here...`
      }

      const { error } = await supabase.from('logs').insert({
        user_id: user.id,
        content_type: 'book',
        title: book.title,
        creator: book.creator || null,
        consumed_date: book.consumedDate || new Date().toISOString().split('T')[0],
        key_points: keyPoints,
        practical_application: 'Imported - add how you\'ll use this',
        summary: 'Imported - add your summary',
        is_shared: false,
      })

      if (error) {
        errorCount++
      } else {
        successCount++
      }
    }

    setImporting(false)
    
    if (successCount > 0) {
      showToast(`Imported ${successCount} books!`)
      setStep('done')
    }
    if (errorCount > 0) {
      showToast(`Failed to import ${errorCount} books`, 'error')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20 max-w-2xl mx-auto px-4 py-6">
        <BackButton />
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Import Books</h1>
        <p className="text-gray-600 mb-6">Import from Goodreads or Excel/CSV</p>

        {step === 'upload' && (
          <div className="bg-white rounded-lg border border-lime-200 p-6">
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-gray-900 mb-2">How to export from Goodreads:</h2>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                  <li>Go to goodreads.com → My Books</li>
                  <li>Click "Import and Export" (left sidebar)</li>
                  <li>Click "Export Library"</li>
                  <li>Upload the CSV file below</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <h2 className="font-semibold text-gray-900 mb-2">Or upload your own CSV/Excel:</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Make sure your file has columns for: Title, Author, and optionally Date Read and Rating
                </p>
              </div>

              <div className="border-2 border-dashed border-lime-300 rounded-lg p-8 text-center">
                {parsing ? (
                  <div className="flex flex-col items-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-amber-700">Parsing file...</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex flex-col items-center"
                    >
                      <svg className="w-12 h-12 text-lime-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-lime-600 font-medium">Click to upload file</span>
                      <span className="text-sm text-gray-500 mt-1">CSV or Excel files</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-lime-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-700">
                  Found <span className="font-semibold">{importedBooks.length}</span> books
                </p>
                <button
                  onClick={toggleAll}
                  className="text-sm text-lime-600 hover:text-lime-700"
                >
                  {importedBooks.every(b => b.selected) ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {importedBooks.map((book, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      book.selected ? 'border-lime-300 bg-lime-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={book.selected}
                        onChange={() => toggleBook(index)}
                        className="mt-1 w-4 h-4 text-lime-600 rounded focus:ring-lime-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{book.title}</p>
                        {book.creator && (
                          <p className="text-sm text-gray-600">by {book.creator}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {book.rating && (
                            <span className="text-sm">{getStarDisplay(book.rating)}</span>
                          )}
                          <span className="text-xs text-gray-400">{formatDate(book.consumedDate)}</span>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('upload')
                  setImportedBooks([])
                  setFile(null)
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing || importedBooks.filter(b => b.selected).length === 0}
                className="flex-1 px-4 py-3 bg-lime-600 text-white rounded-lg font-medium hover:bg-lime-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <Spinner size="sm" />
                    Importing...
                  </>
                ) : (
                  `Import ${importedBooks.filter(b => b.selected).length} Books`
                )}
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center">
              Note: Star ratings will be saved in Key Points. Other fields can be filled in later.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white rounded-lg border border-lime-200 p-8 text-center">
            <svg className="w-16 h-16 text-lime-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Import Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your books have been added to your library. Star ratings are saved in Key Points. Add your reflections whenever you're ready!
            </p>
            <button
              onClick={() => router.push('/library')}
              className="px-6 py-3 bg-lime-600 text-white rounded-lg font-medium hover:bg-lime-700"
            >
              Go to Library
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}