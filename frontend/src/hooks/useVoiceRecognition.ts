import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionStatus = 'idle' | 'listening' | 'error'

interface UseVoiceRecognitionOptions {
  onResult: (text: string) => void
  lang?: string
}

interface UseVoiceRecognitionReturn {
  status: SpeechRecognitionStatus
  isSupported: boolean
  errorMessage: string | null
  startListening: () => void
  stopListening: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

export function useVoiceRecognition({
  onResult,
  lang = 'uk-UA',
}: UseVoiceRecognitionOptions): UseVoiceRecognitionReturn {
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const shouldRestartRef = useRef(false) // чи треба перезапускати

  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? window.SpeechRecognition ?? window.webkitSpeechRecognition
      : undefined

  const isSupported = !!SpeechRecognitionAPI

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      recognitionRef.current?.abort()
    }
  }, [])

  const startRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognitionRef.current = recognition

    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onstart = () => setStatus('listening')

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let newText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newText += event.results[i][0].transcript
        }
      }
      if (newText) onResult(newText.trim())
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone access denied',
        'network': 'Network error',
        'audio-capture': 'No microphone found',
      }
      setErrorMessage(messages[event.error] ?? `Error: ${event.error}`)
      setStatus('error')
      shouldRestartRef.current = false
    }

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        try {
          recognition.start()
        } catch {
          startRecognition()
        }
      } else {
        setStatus('idle')
      }
    }

    recognition.start()
  }, [SpeechRecognitionAPI, lang, onResult])

  const startListening = useCallback(() => {
    setErrorMessage(null)
    shouldRestartRef.current = true
    startRecognition()
  }, [startRecognition])

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false
    recognitionRef.current?.stop()
    setStatus('idle')
  }, [])

  return { status, isSupported, errorMessage, startListening, stopListening }
}