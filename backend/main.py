import os
from io import BytesIO
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fpdf import FPDF
from docx import Document

app = FastAPI(title="DocuMorph Python Backend")

# Enable CORS to allow Next.js (running on localhost:3000 or Vercel) to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your specific frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "DocuMorph Python Conversion Backend is Online"}

@app.post("/api/py/convert")
async def convert_file_to_pdf(file: UploadFile = File(...)):
    """
    Receives an uploaded file (DOCX, TXT, etc.) and converts it directly to a PDF stream.
    """
    try:
        filename = file.filename.lower()
        contents = await file.read()
        
        pdf_output = BytesIO()

        # Handle TXT files
        if filename.endswith(".txt"):
            text_content = contents.decode("utf-8", errors="ignore")
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Helvetica", size=12)
            
            for line in text_content.splitlines():
                pdf.cell(0, 10, text=line, new_x="LMARGIN", new_y="NEXT")
            
            pdf_bytes = pdf.output()
            pdf_output.write(pdf_bytes)

        # Handle DOCX (Word) files
        elif filename.endswith(".docx"):
            doc_file = BytesIO(contents)
            doc = Document(doc_file)
            
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Helvetica", size=12)

            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    pdf.multi_cell(0, 10, text=paragraph.text)
                    pdf.ln(2)
            
            pdf_bytes = pdf.output()
            pdf_output.write(pdf_bytes)

        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format: {filename}. Supported formats: .docx, .txt"
            )

        pdf_output.seek(0)
        
        # Return converted file directly as a downloadable response
        return StreamingResponse(
            pdf_output,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=converted_{os.path.splitext(file.filename)[0]}.pdf"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)