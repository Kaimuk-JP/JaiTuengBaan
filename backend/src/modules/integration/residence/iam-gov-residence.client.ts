import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '../../../core/config';

@Injectable()
export class IamGovResidenceClient {
  private readonly logger = new Logger(IamGovResidenceClient.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiUrl = config.iamGovApiUrl;
    this.apiKey = config.eServiceApiKey;
  }

  private get headers() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async search(params: Record<string, string>): Promise<any[]> {
    const qs = new URLSearchParams(params).toString();
    const url = `${this.apiUrl}/e-services/residences/search?${qs}`;
    this.logger.debug(`Searching residences: ${url}`);
    console.log('\n=== [IAM-GOV Search Request] ===');
    console.log('URL:', url);
    console.log('Headers:', this.headers);
    console.log('Params:', params);
    
    const response = await fetch(url, { headers: this.headers });
  
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');

      this.logger.error(`IAM search failed [${response.status}]: ${errorText}`);
      let parsedMsg = `IAM-GOV residence search failed: ${response.status}`;
      try { parsedMsg = JSON.parse(errorText).message || parsedMsg; } catch (e) {}
      throw new HttpException(parsedMsg, response.status);
    }

    const data = await response.json();
    return data;
  }

  async findById(id: string): Promise<any> {
    const url = `${this.apiUrl}/e-services/residences/${id}`;
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new Error(`IAM-GOV residence read failed: ${response.status}`);
    }

    return response.json();
  }

  async submitClaim(payload: any): Promise<any> {
    const url = `${this.apiUrl}/e-services/residence-claims`;

    this.logger.log(`Submitting residence claim for user: ${payload.submittedByUserId}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      this.logger.error(`IAM claim submit failed [${response.status}]: ${errorText}`);
      let parsedMsg = `IAM-GOV residence claim failed: ${response.status}`;
      try { parsedMsg = JSON.parse(errorText).message || parsedMsg; } catch (e) {}
      const err: any = new Error(parsedMsg);
      err.statusCode = response.status;
      throw err;
    }

    return response.json();
  }

  async uploadEvidence(claimId: string, file: Buffer, filename: string, mimeType: string): Promise<any> {
    const url = `${this.apiUrl}/e-services/residence-claims/${claimId}/evidence`;

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file)], { type: mimeType });
    formData.append('file', blob, filename);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      this.logger.error(`IAM evidence upload failed [${response.status}]: ${errorText}`);
      let parsedMsg = `IAM-GOV evidence upload failed: ${response.status}`;
      try { parsedMsg = JSON.parse(errorText).message || parsedMsg; } catch (e) {}
      throw new HttpException(parsedMsg, response.status);
    }

    return response.json();
  }

  async getClaimStatus(claimId: string): Promise<any> {
    const url = `${this.apiUrl}/e-services/residence-claims/${claimId}`;
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new Error(`IAM-GOV claim status failed: ${response.status}`);
    }

    return response.json();
  }

  async listEvidence(claimId: string): Promise<any[]> {
    const url = `${this.apiUrl}/e-services/residence-claims/${claimId}/evidence`;
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new Error(`IAM-GOV list evidence failed: ${response.status}`);
    }

    return response.json();
  }
}
