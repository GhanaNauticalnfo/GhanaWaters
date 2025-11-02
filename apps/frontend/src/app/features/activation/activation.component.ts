import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-activation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-5 font-sans">
      <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div class="bg-blue-900 text-white p-8 text-center">
          <h1 class="text-2xl m-0 mb-3">Ghana Waters</h1>
          <h2 class="text-lg font-normal m-0 opacity-90">Device Activation</h2>
        </div>
        
        @if (activationToken()) {
          <div class="p-8 text-gray-800">
            <!--
            <div class="bg-gray-100 rounded-lg p-4 mb-5 text-center text-gray-800">
              <p class="font-bold text-gray-800 m-0">Activation Token:</p>
              <div class="font-mono text-base font-bold text-blue-900 bg-white p-3 rounded border-2 border-blue-900 mt-3">{{ activationToken() }}</div>
            </div>
        -->
            <div class="mb-6">
              <h3 class="text-blue-900 mb-4">📱 TO ACTIVATE YOUR DEVICE:</h3>
              <ol class="leading-normal pl-5 text-gray-800">
                <li class="mb-2 text-gray-800">Make sure the Ghana Waters app is installed on your phone</li>
                <li class="mb-2 text-gray-800">Click the button below to activate</li>
                <li class="mb-2 text-gray-800">The app will open and connect automatically</li>
              </ol>
            </div>
            
            <div class="flex gap-4 mb-6 flex-wrap sm:flex-row flex-col">
              <a 
                [href]="getActivationUrl()" 
                class="bg-green-600 hover:bg-green-700 text-white text-base font-bold text-center no-underline px-6 py-4 rounded-lg flex-1 min-w-0 sm:min-w-[200px] transition-colors"
                (click)="handleActivationClick($event)"
              >
                📲 Activate Device
              </a>
              <!--
              <button 
                class="bg-blue-600 hover:bg-blue-700 text-white text-base font-bold border-0 px-5 py-4 rounded-lg cursor-pointer transition-colors" 
                (click)="copyActivationUrl()"
              >
                📋 Copy Link
              </button>
        -->
            </div>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-5 text-yellow-800">
              <p class="font-bold m-0 mb-3 text-yellow-800">If the button doesn't work:</p>
              <ol class="leading-normal m-0 pl-5 text-yellow-800">
                <li class="mb-1">Make sure the Ghana Waters app is installed</li>
                <li class="mb-1">Copy this URL: <code class="text-sm bg-white p-1 rounded font-mono break-all">{{ getActivationUrl() }}</code></li>
                <li class="mb-1">Open any app that supports links (WhatsApp, Notes, etc.)</li>
                <li class="mb-1">Paste and click the link</li>
              </ol>
            </div>
            <!-- I ASSUME everyone has a phoem so not sure this is useful
            <div class="bg-gray-100 rounded-lg p-5 mb-5 text-center text-gray-800">
              <p class="text-gray-800"><span class="font-bold">Alternative:</span> Scan this QR code with your phone's camera</p>
              <div class="bg-white rounded-lg p-5 my-4 inline-block shadow-md">
                <qrcode 
                  [qrdata]="getActivationUrl()" 
                  [width]="200"
                  [errorCorrectionLevel]="'M'"
                  [margin]="4">
                </qrcode>
              </div>
              <small class="text-gray-600 block mt-3">Scan with your phone's camera to activate</small>
            </div>
        -->
          </div>
        } @else {
          <div class="p-8 text-center">
            <h3 class="text-red-600 mb-4">❌ Invalid Activation Link</h3>
            <p>This activation link is missing the required token.</p>
            <p>Please contact your GMA
              p;0lohgfrdsa for a valid activation link.</p>
          </div>
        }
        
        <div class="bg-gray-100 px-5 py-4 border-t border-gray-200 text-center text-gray-600">
          <p><small>Ghana Waters - Ghana Maritime Authority</small></p>
        </div>
      </div>
    </div>
  `
})
export class ActivationComponent implements OnInit {
  activationToken = signal<string | null>(null);

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.activationToken.set(params['token'] || null);
    });
  }

  getActivationUrl(): string {
    return `ghanawaters://auth?token=${this.activationToken()}`;
  }

  copyActivationUrl(): void {
    const url = this.getActivationUrl();
    navigator.clipboard.writeText(url).then(() => {
      alert('Activation link copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Activation link copied to clipboard!');
    });
  }

  handleActivationClick(event: Event): void {
    // Let the browser handle the custom URL scheme
    console.log('Activation URL clicked:', this.getActivationUrl());
    
    // Show a message after a delay in case the app doesn't open
    setTimeout(() => {
      if (document.hasFocus()) {
        alert('If the app did not open, please make sure:\n\n1. Ghana Waters app is installed\n2. Try copying the link and opening it in another app');
      }
    }, 1000);
  }
}