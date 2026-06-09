const puppeteer = require("puppeteer");

const createResumePDF = async (resume) => {

  const html = `
  <html>
  <head>
    <style>

      body{
        font-family: Arial, sans-serif;
        padding:40px;
        color:#333;
      }

      h1{
        color:#1a2b3c;
        margin-bottom:5px;
      }

      .section{
        margin-top:25px;
      }

      .section h2{
        border-bottom:2px solid #eee;
        padding-bottom:5px;
        color:#1a2b3c;
      }

      .item{
        margin-top:10px;
      }

    </style>
  </head>

  <body>

    <h1>${resume.fullName}</h1>
    <p>${resume.jobTitle || ""}</p>
    <p>${resume.email || ""} | ${resume.phone || ""}</p>

    ${
      resume.summary
        ? `
        <div class="section">
          <h2>Summary</h2>
          <p>${resume.summary}</p>
        </div>
      `
        : ""
    }

    ${
      resume.skills?.length
        ? `
        <div class="section">
          <h2>Skills</h2>
          <p>${resume.skills.join(", ")}</p>
        </div>
      `
        : ""
    }

    ${
      resume.languages?.length
        ? `
        <div class="section">
          <h2>Languages</h2>
          <p>${resume.languages.join(", ")}</p>
        </div>
      `
        : ""
    }

    ${
      resume.experiences?.length
        ? `
        <div class="section">
          <h2>Experience</h2>

          ${resume.experiences
            .map(
              (exp) => `
              <div class="item">
                <strong>${exp.experienceTitle}</strong> - ${exp.companyName}
                <p>${exp.duration || ""}</p>
                <p>${exp.workDetails || ""}</p>
              </div>
          `
            )
            .join("")}

        </div>
      `
        : ""
    }

    ${
      resume.education?.length
        ? `
        <div class="section">
          <h2>Education</h2>

          ${resume.education
            .map(
              (edu) => `
            <div class="item">
              <strong>${edu.degree}</strong> - ${edu.institution}
              <p>${edu.year || ""}</p>
            </div>
          `
            )
            .join("")}

        </div>
      `
        : ""
    }

  </body>
  </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    ...(process.env.PUPPETEER_EXECUTABLE_PATH
      ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
      : {}),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const page = await browser.newPage();

  await page.setContent(html);

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true
  });

  await browser.close();

  return pdfBuffer;
};

module.exports = createResumePDF;
