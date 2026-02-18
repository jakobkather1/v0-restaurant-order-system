"use client"

import { useEffect } from "react"

/**
 * Service Worker Provider - Registers the service worker globally
 * This ensures the SW is active before any push notification requests
 */
export function ServiceWorkerProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return
    
    console.log("SW: Provider mounted")
    
    // Check if service worker is supported
    if (!("serviceWorker" in navigator)) {
      console.log("SW: Not supported in this browser")
      return
    }
    
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost"
    if (!isSecure) {
      console.warn("SW: Not in secure context (HTTPS required)")
      return
    }
    
    // Preflight check: Verify sw.js exists and has correct MIME type
    const checkAndRegisterSW = async () => {
      try {
        console.log("SW: Checking if /sw.js is available...")
        const response = await fetch("/sw.js", { method: "HEAD" })
        
        if (!response.ok) {
          console.warn("SW: /sw.js not available (status: " + response.status + ") - skipping registration")
          console.warn("SW: This is expected in preview environments - deploy to production for push notifications")
          return
        }
        
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("javascript")) {
          console.warn("SW: /sw.js has wrong MIME type (" + contentType + ") - skipping registration")
          console.warn("SW: This is expected in preview environments - deploy to production for push notifications")
          return
        }
        
        console.log("SW: /sw.js verified, starting registration...")
        
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
        
        console.log("SW: Registered successfully", {
          scope: registration.scope,
          active: !!registration.active,
          installing: !!registration.installing,
          waiting: !!registration.waiting
        })
        
        // Log when SW becomes active
        if (registration.installing) {
          console.log("SW: Installing...")
          registration.installing.addEventListener("statechange", function() {
            if (this.state === "activated") {
              console.log("SW: Activated!")
            }
          })
        }
        
        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60000) // Check every minute
      } catch (error) {
        // Silent fail - SW is optional for app functionality
        console.warn("SW: Registration failed (non-critical):", error instanceof Error ? error.message : error)
        console.warn("SW: App will work normally, but push notifications won't be available")
      }
    }
    
    checkAndRegisterSW()
    
    // Listen for service worker updates
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("SW: Controller changed - new service worker activated")
    })
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      console.log("SW: Message received from service worker:", event.data)
    })
    
  }, [])
  
  return null // This component doesn't render anything
}
