import { useState, useRef, useEffect } from 'react'
import { Camera, Play, Square, Settings, Download, Moon, Sun } from 'lucide-react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Switch } from './components/ui/switch'
import { Separator } from './components/ui/separator'
import { Progress } from './components/ui/progress'
import { ScrollArea } from './components/ui/scroll-area'

interface DetectedPlate {
  id: string
  plateNumber: string
  confidence: number
  timestamp: Date
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface ProcessingStats {
  totalDetections: number
  averageConfidence: number
  processingTime: number
  fps: number
}

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [detectedPlates, setDetectedPlates] = useState<DetectedPlate[]>([])
  const [currentDetection, setCurrentDetection] = useState<DetectedPlate | null>(null)
  const [stats, setStats] = useState<ProcessingStats>({
    totalDetections: 0,
    averageConfidence: 0,
    processingTime: 0,
    fps: 0
  })
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsRecording(true)
        
        // Simulate plate detection for demo
        simulateDetection()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsRecording(false)
    setCurrentDetection(null)
  }

  const simulateDetection = () => {
    const turkishPlates = [
      '34 ABC 123',
      '06 DEF 456',
      '35 GHI 789',
      '01 JKL 012',
      '16 MNO 345'
    ]

    const interval = setInterval(() => {
      if (!isRecording) {
        clearInterval(interval)
        return
      }

      // Simulate random detection
      if (Math.random() > 0.7) {
        const plateNumber = turkishPlates[Math.floor(Math.random() * turkishPlates.length)]
        const confidence = 75 + Math.random() * 25 // 75-100%
        
        const detection: DetectedPlate = {
          id: Date.now().toString(),
          plateNumber,
          confidence,
          timestamp: new Date(),
          boundingBox: {
            x: 100 + Math.random() * 200,
            y: 100 + Math.random() * 200,
            width: 200 + Math.random() * 100,
            height: 60 + Math.random() * 20
          }
        }

        setCurrentDetection(detection)
        setDetectedPlates(prev => [detection, ...prev.slice(0, 9)]) // Keep last 10

        // Update stats
        setStats(prev => ({
          totalDetections: prev.totalDetections + 1,
          averageConfidence: (prev.averageConfidence * prev.totalDetections + confidence) / (prev.totalDetections + 1),
          processingTime: 45 + Math.random() * 20, // 45-65ms
          fps: 15 + Math.random() * 10 // 15-25 fps
        }))

        // Clear detection after 3 seconds
        setTimeout(() => setCurrentDetection(null), 3000)
      }
    }, 1000)
  }

  const exportData = () => {
    const data = {
      detections: detectedPlates,
      stats,
      exportTime: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plate-detections-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const validateTurkishPlate = (plate: string): boolean => {
    // Turkish plate format: XX ABC 123 or XX AB 1234
    const pattern = /^\d{2}\s[A-Z]{2,3}\s\d{3,4}$/
    return pattern.test(plate)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'dark bg-slate-900' : 'bg-slate-50'
    }`}>
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Camera className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Turkish Plate Recognition
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Real-time license plate detection system
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4" />
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                />
                <Moon className="h-4 w-4" />
              </div>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Camera Feed */}
          <div className="lg:col-span-2">
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Live Camera Feed</CardTitle>
                  <div className="flex items-center space-x-2">
                    {isRecording ? (
                      <Button onClick={stopCamera} variant="destructive" size="sm">
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    ) : (
                      <Button onClick={startCamera} size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Start Detection
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                  />
                  
                  {/* Detection Overlay */}
                  {currentDetection && (
                    <div
                      className="absolute border-2 border-red-500 bg-red-500/20"
                      style={{
                        left: `${(currentDetection.boundingBox.x / 640) * 100}%`,
                        top: `${(currentDetection.boundingBox.y / 480) * 100}%`,
                        width: `${(currentDetection.boundingBox.width / 640) * 100}%`,
                        height: `${(currentDetection.boundingBox.height / 480) * 100}%`,
                      }}
                    >
                      <div className="absolute -top-8 left-0 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                        {currentDetection.plateNumber} ({currentDetection.confidence.toFixed(1)}%)
                      </div>
                    </div>
                  )}
                  
                  {/* Status Indicator */}
                  <div className="absolute top-4 right-4">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                      isRecording 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        isRecording ? 'bg-white animate-pulse' : 'bg-gray-300'
                      }`} />
                      {isRecording ? 'LIVE' : 'STOPPED'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processing Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Processing Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.totalDetections}
                    </div>
                    <div className="text-sm text-gray-500">Total Detections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.averageConfidence.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Avg Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.processingTime.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-gray-500">Processing Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.fps.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">FPS</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Detection */}
            {currentDetection && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Detection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {currentDetection.plateNumber}
                      </div>
                      <Badge 
                        variant={validateTurkishPlate(currentDetection.plateNumber) ? "default" : "destructive"}
                        className="mt-2"
                      >
                        {validateTurkishPlate(currentDetection.plateNumber) ? "Valid Format" : "Invalid Format"}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence:</span>
                        <span className="font-medium">{currentDetection.confidence.toFixed(1)}%</span>
                      </div>
                      <Progress value={currentDetection.confidence} className="h-2" />
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Detected at {currentDetection.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detection History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Detection History</CardTitle>
                  <Button 
                    onClick={exportData} 
                    variant="outline" 
                    size="sm"
                    disabled={detectedPlates.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {detectedPlates.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No detections yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {detectedPlates.map((plate) => (
                        <div 
                          key={plate.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{plate.plateNumber}</div>
                            <div className="text-xs text-gray-500">
                              {plate.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {plate.confidence.toFixed(1)}%
                            </div>
                            <Badge 
                              variant={validateTurkishPlate(plate.plateNumber) ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {validateTurkishPlate(plate.plateNumber) ? "✓" : "✗"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App