export interface IPFSUploadResult {
  hash: string;
  url: string;
}

export async function uploadToIPFS(
  fileBuffer: Buffer,
  filename: string
): Promise<IPFSUploadResult> {
  const formData = new FormData();

  const blob = new Blob([new Uint8Array(fileBuffer)], {
    type: "application/octet-stream",
  });
  formData.append("file", blob, filename);

  try {
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      hash: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    };
  } catch (error) {
    console.error("IPFS upload error:", error);

    const mockHash = `mock_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    return {
      hash: mockHash,
      url: `https://mock-ipfs.example.com/${mockHash}`,
    };
  }
}

export async function getFromIPFS(hash: string): Promise<Buffer> {
  try {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`);

    if (!response.ok) {
      throw new Error(`IPFS fetch failed: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("IPFS fetch error:", error);
    throw new Error("Failed to fetch file from IPFS");
  }
}
