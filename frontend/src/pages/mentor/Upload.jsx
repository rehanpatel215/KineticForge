import React, { useState, useRef } from 'react';
import { 
  Upload as UploadIcon, 
  FileText, 
  X, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Table as TableIcon,
  Info,
  Sparkles,
  RefreshCw,
  Calendar,
  Layers
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { analyzeCsvMapping, inferMissingDates } from '../../lib/gemini';
import { useAuth } from '../../components/auth/AuthContext';
import { supabase } from '../../lib/supabase';

const TARGET_FIELDS = [
  { value: 'IGNORE', label: 'Ignore Column' },
  { value: 'student_name', label: 'Student Name' },
  { value: 'usn', label: 'USN' },
  { value: 'admission_number', label: 'Admission Number' },
  { value: 'email', label: 'Email' },
  { value: 'branch_code', label: 'Branch Code' },
  { value: 'date', label: 'Date' },
  { value: 'attendance_status', label: 'Attendance Status' },
];

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Upload, 1.5: Sheet Select, 2: Mapping, 3: Preview, 4: Result
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mappingResult, setMappingResult] = useState(null);
  const [userMapping, setUserMapping] = useState({}); // { source: target }
  
  // Advanced States
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [processedData, setProcessedData] = useState([]);
  const [dbStudents, setDbStudents] = useState([]);
  const [duplicateSessions, setDuplicateSessions] = useState([]);
  const [showInferenceModal, setShowInferenceModal] = useState(false);
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [inferredDateMap, setInferredDateMap] = useState({}); // { originalHeader: inferredDate }
  const [gapResults, setGapResults] = useState(null);
  
  const fileInputRef = useRef(null);

  const steps = [
    { id: 1, label: 'Upload', icon: UploadIcon },
    { id: 2, label: 'Mapping', icon: TableIcon },
    { id: 3, label: 'Preview', icon: FileText },
    { id: 4, label: 'Import', icon: CheckCircle2 },
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndProcessFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndProcessFile(selectedFile);
  };

  const validateAndProcessFile = (file) => {
    setError(null);
    if (!file) return;

    const validTypes = [
      'text/csv', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    const extension = file.name.split('.').pop().toLowerCase();
    const isValidExtension = ['csv', 'xlsx', 'xls'].includes(extension);

    if (!validTypes.includes(file.type) && !isValidExtension) {
      setError('Please upload a valid CSV or Excel file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    setFile(file);
    parseFile(file);
  };

  const parseFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData({
            headers: results.meta.fields,
            rows: results.data.slice(0, 5), // Only keep 5 for mapping
            allRows: results.data,
            type: 'csv'
          });
        },
        error: (err) => {
          setError('Failed to parse CSV: ' + err.message);
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          setWorkbook(wb);
          setAvailableSheets(wb.SheetNames);
          
          if (wb.SheetNames.length === 1) {
            processExcelSheet(wb, wb.SheetNames[0]);
          } else {
            setStep(1.5);
          }
        } catch (err) {
          setError('Failed to parse Excel file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processExcelSheet = (wb, sheetName) => {
    setSelectedSheet(sheetName);
    const worksheet = wb.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Find the first non-empty row to use as headers
    let headerIndex = 0;
    while (headerIndex < rawRows.length && (!rawRows[headerIndex] || rawRows[headerIndex].length === 0 || rawRows[headerIndex].every(v => v === null || v === ''))) {
      headerIndex++;
    }

    if (headerIndex >= rawRows.length) {
      setError('No data found in the selected sheet.');
      return;
    }

    const headers = rawRows[headerIndex];
    const allRows = XLSX.utils.sheet_to_json(worksheet, { range: headerIndex });

    setParsedData({
      headers: headers,
      rows: allRows.slice(0, 5),
      allRows: allRows,
      type: 'excel',
      sheetName: sheetName
    });
    setStep(1);
  };

  const removeFile = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    setMappingResult(null);
    setUserMapping({});
    setAvailableSheets([]);
    setSelectedSheet(null);
    setWorkbook(null);
    setInferredDateMap({});
    setGapResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startAnalysis = () => {
    if (!parsedData) return;

    // Build an initial mapping instantly
    const headers = parsedData.headers || [];
    const initialMapping = {};
    headers.forEach(h => {
      if (!h) return;
      const lower = h.toString().toLowerCase().trim();
      if (lower.includes('name') && !lower.includes('usn')) {
        initialMapping[h] = 'student_name';
      } else if (lower.includes('usn') || lower.match(/^4sh/i)) {
        initialMapping[h] = 'usn';
      } else if (lower.includes('email')) {
        initialMapping[h] = 'email';
      } else if (lower.includes('admission') || lower.includes('adm')) {
        initialMapping[h] = 'admission_number';
      } else if (lower.includes('branch') || lower.includes('dept')) {
        initialMapping[h] = 'branch_code';
      } else if (lower.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/) || lower.match(/^\d{5}$/)) {
        initialMapping[h] = 'date';
      } else if (lower.includes('date') || lower.includes('session')) {
        initialMapping[h] = 'date';
      } else if (lower.includes('status') || lower.includes('present') || lower.includes('attend')) {
        initialMapping[h] = 'attendance_status';
      } else {
        initialMapping[h] = 'IGNORE';
      }
    });

    const dateColumnCount = Object.values(initialMapping).filter(v => v === 'date').length;
    const isPivoted = dateColumnCount >= 3;

    const initialResult = {
      date_format: 'DD/M/YY',
      attendance_convention: 'P/A',
      is_pivoted: isPivoted,
      confidence: 0.5
    };

    setUserMapping(initialMapping);
    setMappingResult(initialResult);

    // Show a brief "AI is mapping..." overlay on step 1, then auto-proceed to validation
    setIsAnalyzing(true);

    analyzeCsvMapping(parsedData.headers, parsedData.rows)
      .then(result => {
        // AI refined the mapping — use it
        const finalMapping = result.mapping || initialMapping;
        const finalResult = { ...initialResult, ...result };
        setMappingResult(finalResult);
        setUserMapping(finalMapping);
        // Auto-proceed straight to preview (skip manual step 2)
        return autoValidate(finalMapping, finalResult);
      })
      .catch(() => {
        // AI failed — fall back to local mapping and still auto-validate
        return autoValidate(initialMapping, initialResult);
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  };

  const [importHistory, setImportHistory] = useState([]);

  React.useEffect(() => {
    fetchImportHistory();
  }, []);

  const fetchImportHistory = async () => {
    const { data } = await supabase
      .from('import_log')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(5);
    setImportHistory(data || []);
  };

  const getLevenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const findFuzzyMatch = (name, students) => {
    if (!name) return null;
    let bestMatch = null;
    let minDistance = 3;
    students.forEach(s => {
      const distance = getLevenshteinDistance(name.toLowerCase(), s.name.toLowerCase());
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = s;
      }
    });
    return bestMatch;
  };

  const parseDate = (dateStr, format) => {
    if (!dateStr) return null;
    if (inferredDateMap[dateStr]) return inferredDateMap[dateStr];

    const f = format.toUpperCase();
    try {
      if (f === 'YYYY-MM-DD') return dateStr;
      const parts = dateStr.split(/[/-]/);
      if (parts.length !== 3) return null;
      let d, m, y;
      if (f.startsWith('DD')) { [d, m, y] = parts; }
      else if (f.startsWith('MM')) { [m, d, y] = parts; }
      else { return null; }
      if (y.length === 2) { y = parseInt(y) < 50 ? '20' + y : '19' + y; }
      const dateObj = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
      if (isNaN(dateObj.getTime())) return null;
      return dateObj.toISOString().split('T')[0];
    } catch (e) { return null; }
  };

  const parseStatus = (val, convention) => {
    if (val === undefined || val === null || val === '') return null;
    const s = val.toString().trim().toUpperCase();
    switch (convention) {
      case 'TRUE/FALSE': return s === 'TRUE';
      case 'P/A': return s === 'P';
      case '1/0': return s === '1';
      case 'Present/Absent': return s === 'PRESENT';
      case 'Y/N': return s === 'Y';
      default: return s === 'TRUE' || s === 'P' || s === '1' || s === 'PRESENT' || s === 'Y';
    }
  };

  const runGapAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const currentStudentIds = new Set(processedData.map(d => d.matchedStudent?.id).filter(Boolean));
      const missingStudents = dbStudents.filter(s => !currentStudentIds.has(s.id));
      setGapResults(missingStudents);
    } catch (err) {
      setError('Gap analysis failed: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInferDates = async () => {
    if (!scheduleDescription) return;
    setIsAnalyzing(true);
    try {
      const headersToInfer = Object.keys(userMapping).filter(h => userMapping[h] === 'date');
      const result = await inferMissingDates(headersToInfer, scheduleDescription);
      setInferredDateMap(result.inferred_dates);
      setShowInferenceModal(false);
    } catch (err) {
      setError('AI Date Inference failed: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Core validation logic — shared by manual and auto flows
  const runValidation = async (mapping, result) => {
    const { data: students } = await supabase.from('students').select('*');
    setDbStudents(students || []);

    const distinctDatesInFile = [...new Set(
      result.is_pivoted
        ? Object.keys(mapping).filter(h => mapping[h] === 'date').map(h => parseDate(h, result.date_format))
        : parsedData.allRows.map(row => {
            const sourceCol = Object.keys(mapping).find(h => mapping[h] === 'date');
            return parseDate(row[sourceCol], result.date_format);
          })
    )].filter(Boolean);

    const { data: existingSessions } = await supabase
      .from('sessions')
      .select('date, topic')
      .in('date', distinctDatesInFile);
    setDuplicateSessions(existingSessions || []);

    const candidates = [];
    const isPivoted = result.is_pivoted;
    const dateColumns = isPivoted ? Object.keys(mapping).filter(h => mapping[h] === 'date') : [];

    parsedData.allRows.forEach((row, rowIndex) => {
      if (Object.values(row).every(v => !v)) return;
      const getField = (fieldName) => {
        const sourceCol = Object.keys(mapping).find(h => mapping[h] === fieldName);
        return sourceCol ? row[sourceCol] : null;
      };
      const baseRecord = {
        student_name: getField('student_name'),
        usn: getField('usn')?.toString().trim().toUpperCase(),
        admission_number: getField('admission_number'),
        email: getField('email'),
        branch_code: getField('branch_code'),
        rowIndex
      };
      if (isPivoted) {
        dateColumns.forEach(dateCol => {
          const statusVal = row[dateCol];
          const present = parseStatus(statusVal, result.attendance_convention);
          if (present === null) return;
          const date = parseDate(dateCol, result.date_format);
          candidates.push({ ...baseRecord, date, present, source_date_col: dateCol });
        });
      } else {
        const dateStr = getField('date');
        const date = parseDate(dateStr, result.date_format);
        const statusVal = getField('attendance_status');
        const present = parseStatus(statusVal, result.attendance_convention);
        if (present !== null) { candidates.push({ ...baseRecord, date, present }); }
      }
    });

    const validated = candidates.map(c => {
      const errors = [];
      const info = []; // informational only — won't block import
      let matchedStudent = null;

      if (!c.student_name && !c.usn) errors.push('No student identifier found');
      if (!c.date) errors.push('Invalid or missing date');
      if (c.date && (new Date(c.date) > new Date())) errors.push('Date in future');
      if (c.date && (new Date(c.date) < new Date('2025-08-04'))) errors.push('Date before program start');

      if (c.usn) {
        matchedStudent = students.find(s => s.usn === c.usn);
        // AI auto-decision: USN not in DB → will be created as new student (not a warning)
        if (!matchedStudent) info.push('New student — will be created on import');
      } else if (c.student_name) {
        matchedStudent = students.find(s => s.name.toLowerCase() === c.student_name.toLowerCase());
        if (!matchedStudent) {
          // AI auto-decision: try fuzzy match and accept it silently
          matchedStudent = findFuzzyMatch(c.student_name, students);
          if (!matchedStudent) info.push('New student — will be created on import');
        }
      }

      const status = errors.length > 0 ? 'error' : 'clean';
      return {
        ...c,
        id: `${c.usn || c.student_name}-${c.date}`,
        matchedStudent,
        status,
        issues: errors,   // only real errors shown
        info              // informational notes (non-blocking)
      };
    });

    return validated;
  };

  // Auto-validate: called after AI mapping resolves (skips step 2 UI)
  const autoValidate = async (mapping, result) => {
    try {
      const validated = await runValidation(mapping, result);
      setProcessedData(validated);
      setStep(3);
    } catch (err) {
      setError('AI validation failed: ' + err.message);
      setStep(2); // fall back to manual step if something went wrong
    }
  };

  // Manual validate: triggered from step 2 if user is on that page
  const validateData = async () => {
    setIsAnalyzing(true);
    try {
      const validated = await runValidation(userMapping, mappingResult);
      setProcessedData(validated);
      setStep(3);
    } catch (err) { setError('Validation failed: ' + err.message); }
    finally { setIsAnalyzing(false); }
  };

  const handleResolveWarning = (recordId, studentId) => {
    const student = dbStudents.find(s => s.id === parseInt(studentId));
    setProcessedData(prev => prev.map(row => {
      if (row.id === recordId) {
        return { 
          ...row, 
          matchedStudent: student,
          usn: student?.usn || row.usn,
          status: row.issues.some(i => i.includes('Date')) ? 'error' : 'clean',
          issues: row.issues.filter(i => !i.includes('match') && !i.includes('USN'))
        };
      }
      return row;
    }));
  };

  const handleMappingChange = (source, target) => {
    setUserMapping(prev => ({ ...prev, [source]: target }));
  };

  const togglePivoted = () => {
    setMappingResult(prev => ({ ...prev, is_pivoted: !prev.is_pivoted }));
  };

  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);

  const executeImport = async () => {
    setStep(4);
    setIsAnalyzing(true);
    setError(null);
    setImportProgress(0);

    let logEntry = null;
    try {
      // Guard: check if this exact filename was already successfully imported
      const { data: existingLog } = await supabase
        .from('import_log')
        .select('id, status, uploaded_at')
        .eq('filename', file.name)
        .eq('status', 'completed')
        .maybeSingle();

      if (existingLog) {
        const importedOn = new Date(existingLog.uploaded_at).toLocaleDateString();
        const proceed = window.confirm(
          `"${file.name}" was already imported on ${importedOn}.\n\nImporting again will overwrite existing attendance records for those dates.\n\nContinue?`
        );
        if (!proceed) {
          setStep(3);
          setIsAnalyzing(false);
          return;
        }
        // Delete the old log entry so the upsert can replace it cleanly
        await supabase.from('import_log').delete().eq('id', existingLog.id);
      }

      const { data: newLogEntry, error: logError } = await supabase
        .from('import_log')
        .insert([{
          filename: file.name,
          uploaded_by: user.display_name,
          total_rows: processedData.length,
          imported_rows: 0,
          skipped_rows: 0,
          status: 'in_progress',
          column_mapping: JSON.stringify(userMapping)
        }])
        .select()
        .single();

      if (logError) throw logError;
      logEntry = newLogEntry;

      const validData = processedData.filter(d => d.status === 'clean');
      const skippedCount = processedData.length - validData.length;

      const distinctDates = [...new Set(validData.map(d => d.date))];
      const sessionMap = {};

      for (const d of distinctDates) {
        const monthNum = new Date(d).getMonth() + 1;
        const { data: sess, error: sessError } = await supabase
          .from('sessions')
          .upsert({ 
            date: d, 
            topic: 'Imported Session', 
            month_number: monthNum,
            session_type: 'offline',
            duration_hours: 2.0
          }, { onConflict: 'date' })
          .select()
          .single();
        
        if (sessError) throw sessError;
        sessionMap[d] = sess.id;
      }

      const studentsToUpsert = [];
      const studentMap = {};

      validData.forEach(row => {
        if (!row.matchedStudent && row.usn) {
          studentsToUpsert.push({
            name: row.student_name || 'New Student',
            usn: row.usn,
            branch_code: row.branch_code || 'CS',
            is_active: true
          });
        } else if (row.matchedStudent) {
          studentMap[row.usn || row.student_name] = row.matchedStudent.id;
        }
      });

      const uniqueNewStudents = Array.from(new Map(studentsToUpsert.map(s => [s.usn, s])).values());

      if (uniqueNewStudents.length > 0) {
        const { data: newStudents, error: studError } = await supabase
          .from('students')
          .upsert(uniqueNewStudents, { onConflict: 'usn' })
          .select();
        
        if (studError) throw studError;
        newStudents.forEach(s => studentMap[s.usn] = s.id);
      }

      const batches = [];
      for (let i = 0; i < validData.length; i += 50) {
        batches.push(validData.slice(i, i + 50));
      }

      let importedCount = 0;
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const attendanceRecords = batch.map(row => ({
          student_id: studentMap[row.usn || row.student_name],
          session_id: sessionMap[row.date],
          present: row.present,
          marked_by: 'csv_import',
          import_id: logEntry.id
        })).filter(r => r.student_id && r.session_id);

        const { error: attError } = await supabase
          .from('attendance')
          .upsert(attendanceRecords, { onConflict: 'student_id,session_id' });

        if (attError) throw attError;
        
        importedCount += attendanceRecords.length;
        setImportProgress(Math.round((importedCount / validData.length) * 100));
      }

      await supabase
        .from('import_log')
        .update({ 
          status: 'completed', 
          imported_rows: importedCount,
          skipped_rows: skippedCount + (validData.length - importedCount)
        })
        .eq('id', logEntry.id);

      setImportResults({
        total: processedData.length,
        imported: importedCount,
        sessions: distinctDates.length,
        newStudents: uniqueNewStudents.length
      });

    } catch (err) {
      console.error("Import execution error:", err);
      setError('Import failed: ' + err.message);
      if (logEntry) await supabase.from('import_log').update({ status: 'failed' }).eq('id', logEntry.id);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    if ((step === 1 || step === 1.5) && parsedData) {
      startAnalysis();
    } else if (step === 2) {
      validateData();
    } else if (step === 3) {
      executeImport();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display-md text-primary font-display mb-2">Import Attendance</h1>
          <p className="text-body text-secondary">Upload and map historical records using AI-assisted detection.</p>
        </div>
        {step > 1 && (
          <button 
            onClick={() => {
              if (step === 4 && importResults) {
                removeFile();
                setStep(1);
              } else {
                setStep(step - 1);
              }
            }}
            className="text-sm font-medium text-tertiary hover:text-primary transition-colors flex items-center gap-1"
          >
            {step === 4 && importResults ? 'Start Over' : `Back to ${steps[Math.max(0, Math.floor(step) - 2)]?.label || 'Upload'}`}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between bg-surface bg-card-gradient border border-subtle rounded-xl p-4 shadow-[var(--shadow-card)]">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${(step === s.id || (s.id === 1 && step === 1.5)) ? 'bg-surface-raised text-primary shadow-[var(--shadow-card)] border border-default scale-[1.02]' : 'text-tertiary'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${step >= s.id ? 'border-accent-glow text-accent-glow shadow-[0_0_10px_rgba(111,101,255,0.3)]' : 'border-subtle text-tertiary'}`}>
                {step > s.id ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-subtle mx-4 hidden sm:block"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {(step === 1 || step === 1.5) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer
                ${isDragging ? 'border-accent-glow bg-surface-raised/50 scale-[1.01]' : 'border-subtle hover:border-default bg-surface'}
                ${file ? 'border-success-border bg-success-bg/5' : ''}
                ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv, .xlsx, .xls" className="hidden" />
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${file ? 'bg-success-bg text-success' : 'bg-surface-raised text-tertiary group-hover:text-primary'}`}>
                {file ? <CheckCircle2 size={32} /> : <UploadIcon size={32} />}
              </div>
              {file ? (
                <div className="space-y-1">
                  <p className="text-body-lg text-primary font-medium">{file.name}</p>
                  <p className="text-caption text-secondary">{(file.size / 1024).toFixed(1)} KB • Ready for processing</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-body-lg text-primary font-medium">Click or drag to upload</p>
                  <p className="text-caption text-secondary">CSV or Excel (XLSX, XLS) up to 5MB</p>
                </div>
              )}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-void/20 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center">
                  <RefreshCw className="text-accent-glow animate-spin mb-4" size={32} />
                  <p className="text-body font-display text-primary">Gemini is analyzing your file...</p>
                </div>
              )}
            </div>
            {error && (
              <div className="flex items-center gap-2 text-danger p-4 bg-danger-bg/10 border border-danger-border rounded-xl">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            {file && !isAnalyzing && (
              <div className="border border-accent-glow/30 bg-accent-glow/5 rounded-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                {/* Filename banner */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-accent-glow/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-accent-glow/10 rounded-lg shrink-0">
                      <FileText size={18} className="text-accent-glow" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary truncate" title={file.name}>{file.name}</p>
                      <p className="text-[11px] text-tertiary">{(file.size / 1024).toFixed(1)} KB • {file.name.split('.').pop().toUpperCase()}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    className="ml-3 p-1.5 rounded-md text-tertiary hover:text-danger hover:bg-danger-bg/20 transition-colors shrink-0"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
                {/* Row & column stats */}
                <div className="flex divide-x divide-accent-glow/10">
                  <div className="flex-1 px-4 py-3">
                    <p className="text-[10px] text-tertiary uppercase tracking-widest mb-0.5">Rows</p>
                    <p className="text-sm font-bold text-primary">{parsedData?.allRows.length ?? '—'}</p>
                  </div>
                  <div className="flex-1 px-4 py-3">
                    <p className="text-[10px] text-tertiary uppercase tracking-widest mb-0.5">Columns</p>
                    <p className="text-sm font-bold text-primary">{parsedData?.headers.length ?? '—'}</p>
                  </div>
                  {selectedSheet && (
                    <div className="flex-1 px-4 py-3">
                      <p className="text-[10px] text-tertiary uppercase tracking-widest mb-0.5">Sheet</p>
                      <p className="text-sm font-bold text-primary truncate">{selectedSheet}</p>
                    </div>
                  )}
                  <div className="flex-1 px-4 py-3">
                    <p className="text-[10px] text-tertiary uppercase tracking-widest mb-0.5">Status</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success"><CheckCircle2 size={12} />Ready</span>
                  </div>
                </div>
              </div>
            )}
            {step === 1.5 && (
              <div className="bg-accent-glow/5 border border-accent-glow/30 rounded-xl p-6 shadow-[var(--shadow-card)] animate-in slide-in-from-bottom-4">
                <h3 className="text-h3 text-primary mb-2 flex items-center gap-2"><Layers size={18} className="text-accent-glow" /> Select Worksheet</h3>
                <p className="text-xs text-secondary mb-4">This workbook has multiple sheets. Select the one with attendance data.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableSheets.map(sheet => (
                    <button 
                      key={sheet}
                      onClick={() => processExcelSheet(workbook, sheet)}
                      className="p-4 text-left bg-surface-inset border border-default rounded-xl hover:border-accent-glow hover:bg-surface-raised transition-all group"
                    >
                      <p className="text-sm font-medium text-primary group-hover:text-accent-glow">{sheet}</p>
                      <p className="text-[10px] text-tertiary uppercase tracking-widest mt-1">Excel Sheet</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {importHistory.length > 0 && (
              <div className="bg-surface border border-subtle rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
                <div className="p-4 border-b border-subtle"><h3 className="text-xs font-bold text-primary uppercase tracking-widest">Recent Imports</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-inset text-[10px] text-tertiary uppercase tracking-widest">
                        <th className="p-4">Filename</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Rows</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {importHistory.map(log => (
                        <tr key={log.id} className="text-xs text-secondary hover:bg-surface-raised transition-colors">
                          <td className="p-4 font-medium text-primary">{log.filename}</td>
                          <td className="p-4">{new Date(log.uploaded_at).toLocaleDateString()}</td>
                          <td className="p-4">{log.imported_rows}/{log.total_rows}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${log.status === 'completed' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>{log.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="bg-surface border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)]">
              <h3 className="text-h3 text-primary mb-4 flex items-center gap-2"><Info size={18} className="text-accent-glow" /> Quick Guide</h3>
              <ul className="space-y-4 text-sm text-secondary">
                <li className="flex gap-3"><div className="w-5 h-5 rounded-full bg-surface-raised border border-default flex items-center justify-center shrink-0 mt-0.5 text-[10px]">1</div><span>AI detects names, USNs, and complex pivoted date layouts.</span></li>
                <li className="flex gap-3"><div className="w-5 h-5 rounded-full bg-surface-raised border border-default flex items-center justify-center shrink-0 mt-0.5 text-[10px]">2</div><span>Supports P/A, TRUE/FALSE, 1/0, and Y/N markers.</span></li>
                <li className="flex gap-3"><div className="w-5 h-5 rounded-full bg-surface-raised border border-default flex items-center justify-center shrink-0 mt-0.5 text-[10px]">3</div><span>Review and correct mappings before final validation.</span></li>
              </ul>
            </div>
            <button onClick={handleNext} disabled={!parsedData} className="w-full h-[56px] bg-fg-primary text-void rounded-xl font-display font-bold text-[16px] hover:bg-[#E5E5E7] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group">
              Continue to Mapping<ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* ── Sticky bottom bar: shows when a file is selected on step 1 ── */}
      {(step === 1 || step === 1.5) && file && !isAnalyzing && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-subtle bg-surface/80 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-2 duration-300">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-accent-glow/10 rounded-lg shrink-0">
                <FileText size={16} className="text-accent-glow" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary truncate" title={file.name}>{file.name}</p>
                <p className="text-[11px] text-tertiary">
                  {parsedData ? `${parsedData.allRows.length} rows • ${parsedData.headers.length} columns` : 'Parsing...'}
                  {selectedSheet ? ` • ${selectedSheet}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleNext}
              disabled={!parsedData}
              className="shrink-0 h-[44px] bg-fg-primary text-void rounded-xl font-display font-bold text-[14px] px-6 hover:bg-[#E5E5E7] transition-all disabled:opacity-50 flex items-center gap-2 group"
            >
              Continue to Mapping <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-right-4 duration-500">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-surface bg-card-gradient border border-subtle rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
              <div className="p-6 border-b border-subtle flex justify-between items-center">
                <h3 className="text-h3 text-primary flex items-center gap-2"><Sparkles size={20} className="text-accent-glow" /> AI Suggested Mapping</h3>
                <div className="flex items-center gap-4"><span className="text-caption text-tertiary">Confidence Score: {Math.round((mappingResult?.confidence || 0.8) * 100)}%</span></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-inset border-b border-subtle">
                      <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">Source Column</th>
                      <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">Sample Data</th>
                      <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">Target Field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {parsedData?.headers.map((header, i) => (
                      <tr key={i} className="hover:bg-surface-raised transition-colors">
                        <td className="p-4"><span className="text-sm font-medium text-primary">{header}</span></td>
                        <td className="p-4"><span className="text-sm text-tertiary truncate max-w-[200px] inline-block">{parsedData.rows[0]?.[header]?.toString() || '(empty)'}</span></td>
                        <td className="p-4">
                          <select value={userMapping[header] || 'IGNORE'} onChange={(e) => handleMappingChange(header, e.target.value)} className={`w-full max-w-[200px] bg-surface-inset border rounded-md px-3 h-[36px] text-sm focus:border-accent-glow outline-none transition-colors ${userMapping[header] !== 'IGNORE' ? 'border-accent-glow text-accent-glow' : 'border-default text-secondary'}`}>
                            {TARGET_FIELDS.map(f => (<option key={f.value} value={f.value}>{f.label}</option>))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-surface border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)] space-y-6">
              <h4 className="text-label text-tertiary uppercase tracking-widest">Configuration</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary text-sm font-medium"><Layers size={16} className="text-accent-glow" /> <span>Pivoted Layout</span></div>
                  <button onClick={togglePivoted} className={`w-10 h-5 rounded-full relative transition-colors ${mappingResult?.is_pivoted ? 'bg-accent-glow' : 'bg-surface-inset border border-default'}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${mappingResult?.is_pivoted ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary text-sm font-medium"><Calendar size={16} className="text-accent-glow" /> <span>Date Format</span></div>
                  <input type="text" value={mappingResult?.date_format || 'DD/MM/YYYY'} onChange={(e) => setMappingResult(prev => ({ ...prev, date_format: e.target.value }))} className="w-full bg-surface-inset border border-default rounded-md px-3 h-[36px] text-sm text-primary focus:border-accent-glow outline-none" placeholder="e.g. DD/M/YY" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary text-sm font-medium"><CheckCircle2 size={16} className="text-accent-glow" /> <span>Status Marker</span></div>
                  <select value={mappingResult?.attendance_convention || 'P/A'} onChange={(e) => setMappingResult(prev => ({ ...prev, attendance_convention: e.target.value }))} className="w-full bg-surface-inset border border-default rounded-md px-3 h-[36px] text-sm text-primary focus:border-accent-glow outline-none">
                    <option value="P/A">P/A</option><option value="TRUE/FALSE">TRUE/FALSE</option><option value="1/0">1/0</option><option value="Present/Absent">Present/Absent</option><option value="Y/N">Y/N</option>
                  </select>
                </div>
                <div className="pt-4 border-t border-subtle">
                  <button 
                    onClick={() => setShowInferenceModal(true)}
                    className="w-full py-2 px-3 bg-surface-raised border border-dashed border-accent-glow/50 text-accent-glow rounded-lg text-xs font-medium hover:bg-accent-glow/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} /> Infer Dates with AI
                  </button>
                  {Object.keys(inferredDateMap).length > 0 && (
                    <p className="text-[10px] text-success mt-2 text-center">✓ {Object.keys(inferredDateMap).length} dates inferred</p>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleNext} className="w-full h-[56px] bg-fg-primary text-void rounded-xl font-display font-bold text-[16px] hover:bg-[#E5E5E7] transition-all flex items-center justify-center gap-2 group">
              Verify & Validate<ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          {duplicateSessions.length > 0 && (
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-start gap-4 shadow-lg shadow-warning/5 animate-in slide-in-from-top-2">
              <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-warning uppercase tracking-widest mb-1">Potential Duplicates Detected</h4>
                <p className="text-xs text-secondary leading-relaxed">
                  We found {duplicateSessions.length} sessions that already exist in the database for the dates in this file: 
                  <span className="font-medium text-primary ml-1">
                    {duplicateSessions.map(s => s.date).join(', ')}
                  </span>.
                  Continuing will overwrite attendance for these dates.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-raised border border-default p-4 rounded-xl shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success"></div><span className="text-sm text-primary font-medium">{processedData.filter(d => d.status === 'clean').length} Ready</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-glow"></div><span className="text-sm text-primary font-medium">{processedData.filter(d => d.info?.length > 0).length} New Students</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-danger"></div><span className="text-sm text-primary font-medium">{processedData.filter(d => d.status === 'error').length} Errors</span></div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={runGapAnalysis}
                className="px-4 py-2.5 bg-surface-raised text-primary border border-default rounded-lg text-sm font-medium hover:bg-surface transition-all flex items-center gap-2"
              >
                <Sparkles size={16} className="text-accent-glow" /> Scan for Gaps
              </button>
              <button onClick={handleNext} disabled={processedData.filter(d => d.status === 'clean').length === 0} className="bg-fg-primary text-void rounded-lg px-6 py-2.5 font-display font-bold text-sm hover:bg-[#E5E5E7] transition-all disabled:opacity-50 flex items-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Confirm & Import {processedData.filter(d => d.status === 'clean').length} Records
                {processedData.some(d => d.status === 'error') && <span className="text-[10px] font-normal opacity-60">({processedData.filter(d => d.status === 'error').length} skipped)</span>}
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {gapResults && (
            <div className="p-6 bg-accent-glow/5 border border-accent-glow/20 rounded-xl animate-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-accent-glow uppercase tracking-widest flex items-center gap-2">
                  <Info size={16} /> Gap Analysis: {gapResults.length} Students Missing
                </h4>
                <button onClick={() => setGapResults(null)} className="text-xs text-tertiary hover:text-primary">Dismiss</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {gapResults.map(s => (
                  <div key={s.id} className="px-3 py-1 bg-surface-raised border border-default rounded-full text-xs text-secondary flex items-center gap-2">
                    <span className="font-medium text-primary">{s.name}</span>
                    <span className="text-[10px] font-mono text-tertiary">{s.usn}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-tertiary">Note: These students exist in your database but were not found in the current sheet. You may want to check if they were missed during data entry.</p>
            </div>
          )}

          <div className="bg-surface border border-subtle rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-surface-inset border-b border-subtle">
                    <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">Status</th>
                    <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">Student</th>
                    <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">USN</th>
                    <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">Date</th>
                    <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">Attendance</th>
                    <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">Issue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {processedData.map((row, i) => (
                    <tr key={i} className={`hover:bg-surface-raised transition-colors ${row.status === 'error' ? 'bg-danger/5' : ''}`}>
                      <td className="p-4"><div className={`w-2 h-8 rounded-full ${row.status === 'clean' ? 'bg-success' : row.status === 'warning' ? 'bg-warning' : 'bg-danger shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}></div></td>
                      <td className="p-4 text-sm text-primary font-medium">{row.student_name}</td>
                      <td className="p-4 text-sm text-tertiary font-mono">{row.usn}</td>
                      <td className="p-4 text-sm text-secondary">{row.date}</td>
                      <td className="p-4"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${row.present ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>{row.present ? 'Present' : 'Absent'}</span></td>
                      <td className="p-4">
                        {row.issues.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {row.issues.map((iss, j) => (
                              <span key={j} className="text-[11px] font-medium text-danger">{iss}</span>
                            ))}
                          </div>
                        ) : row.info?.length > 0 ? (
                          <span className="text-[11px] text-tertiary italic">{row.info[0]}</span>
                        ) : (
                          <span className="text-xs text-tertiary">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-500">
          {!importResults ? (
            <div className="max-w-md w-full space-y-8">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 border-4 border-subtle rounded-full"></div>
                <div className="absolute inset-0 border-4 border-accent-glow rounded-full transition-all duration-500" style={{ clipPath: `inset(${100 - importProgress}% 0 0 0)` }}></div>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-h2 text-primary font-display">{importProgress}%</span></div>
              </div>
              <div className="space-y-2"><h2 className="text-h2 text-primary">Importing Records...</h2><p className="text-body text-secondary">Processing {processedData.length} attendance records across {new Set(processedData.map(d => d.date)).size} sessions.</p></div>
            </div>
          ) : (
            <div className="max-w-2xl w-full space-y-10">
              <div className="w-20 h-20 bg-success-bg text-success border border-success-border rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]"><CheckCircle2 size={40} /></div>
              <div className="space-y-2"><h2 className="text-display-sm text-primary font-display">Import Complete!</h2><p className="text-body-lg text-secondary">Successfully processed your attendance file.</p></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-surface border border-subtle p-4 rounded-xl"><div className="text-h3 text-primary">{importResults.total}</div><div className="text-label text-tertiary uppercase text-[10px] mt-1">Total Rows</div></div>
                <div className="bg-surface border border-subtle p-4 rounded-xl"><div className="text-h3 text-success">{importResults.imported}</div><div className="text-label text-tertiary uppercase text-[10px] mt-1">Imported</div></div>
                <div className="bg-surface border border-subtle p-4 rounded-xl"><div className="text-h3 text-accent-glow">{importResults.sessions}</div><div className="text-label text-tertiary uppercase text-[10px] mt-1">Sessions</div></div>
                <div className="bg-surface border border-subtle p-4 rounded-xl"><div className="text-h3 text-primary">{importResults.newStudents}</div><div className="text-label text-tertiary uppercase text-[10px] mt-1">New Students</div></div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto px-8 py-3 bg-fg-primary text-void rounded-lg font-medium hover:bg-[#E5E5E7] transition-colors">Go to Dashboard</button>
                <button onClick={removeFile} className="w-full sm:w-auto px-8 py-3 bg-surface-raised text-primary border border-default rounded-lg font-medium hover:bg-surface transition-colors">Upload Another File</button>
              </div>
            </div>
          )}
        </div>
      )}

      <InferenceModal 
        isOpen={showInferenceModal}
        onClose={() => setShowInferenceModal(false)}
        onConfirm={handleInferDates}
        description={scheduleDescription}
        setDescription={setScheduleDescription}
        loading={isAnalyzing}
      />
    </div>
  );
}

function InferenceModal({ isOpen, onClose, onConfirm, description, setDescription, loading }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-surface bg-card-gradient border border-subtle rounded-2xl p-8 max-w-lg w-full shadow-[var(--shadow-focus)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-glow/10 flex items-center justify-center text-accent-glow">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-h3 text-primary">AI Date Inference</h3>
            <p className="text-caption text-secondary">Gemini will suggest dates for your columns.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-label text-tertiary uppercase tracking-widest mb-2">Schedule Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Classes are every Monday and Wednesday starting from August 4th, 2025."
              className="w-full bg-surface-inset border border-default rounded-xl p-4 min-h-[120px] text-primary text-sm focus:border-accent-glow outline-none transition-all placeholder:text-tertiary"
            />
          </div>
          <div className="bg-surface-raised/50 border border-default p-4 rounded-xl">
            <p className="text-[11px] text-tertiary leading-relaxed">
              <Info size={12} className="inline mr-1 mb-0.5" />
              Tip: Be specific about the start date and the days of the week. The AI will map headers in order.
            </p>
          </div>
        </div>
        <div className="flex gap-4 mt-8">
          <button onClick={onClose} className="flex-1 px-6 py-3 bg-surface-raised text-primary border border-default rounded-xl font-medium hover:bg-surface transition-colors">Cancel</button>
          <button 
            onClick={onConfirm} 
            disabled={!description || loading}
            className="flex-[2] px-6 py-3 bg-fg-primary text-void rounded-xl font-bold hover:bg-[#E5E5E7] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            {loading ? 'Inferring...' : 'Apply AI Dates'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AlertTriangle(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
