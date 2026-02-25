-- Update Convenio de Confidencialidad template (faithful reproduction)
UPDATE plantillas_contrato 
SET contenido_html = '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6;">
<h2 style="text-align: center; font-weight: bold;">CONTRATO DE CONFIDENCIALIDAD</h2>

<p style="text-align: center;">Ciudad de México, a {{fecha_actual}}</p>

<p>El que suscribe, <strong>{{nombre_completo}}</strong>, con CURP <strong>{{curp}}</strong>, y domicilio en <strong>{{direccion}}</strong>, en adelante "EL PRESTADOR DE SERVICIOS".</p>

<p>Por una parte, la empresa <strong>GSM CUSTODIAS S.A.P.I. DE C.V.</strong>, representada en este acto por la C. <strong>JULIA RODRIGUEZ VARGAS</strong>, en adelante "EL CONTRATANTE".</p>

<p>Ambas partes acuerdan celebrar el presente Contrato de Confidencialidad, sujeto a las siguientes:</p>

<h3 style="text-align: center;">C L Á U S U L A S</h3>

<p><strong>PRIMERA.- OBJETO.</strong> EL PRESTADOR DE SERVICIOS se compromete a mantener estricta confidencialidad sobre toda la información relacionada con clientes, rutas, procedimientos operativos, datos personales de terceros, estrategias comerciales, información financiera y cualquier dato sensible al que tenga acceso con motivo de la prestación de sus servicios a EL CONTRATANTE.</p>

<p>Para efectos de este contrato, se entiende por "Información Confidencial" toda aquella información técnica, administrativa, industrial, comercial o de datos personales, incluyendo pero sin limitarse a: secretos industriales, manuales, códigos, reportes, planes de negocio, datos de clientes, rutas de custodia, información de operadores de transporte, datos financieros, estrategias de mercado, y cualquier otra información identificada o reservada como confidencial por EL CONTRATANTE.</p>

<p><strong>SEGUNDA.- ALCANCE.</strong> EL PRESTADOR DE SERVICIOS se obliga a:</p>
<ol type="a" style="margin-left: 20px;">
<li>No divulgar, revelar, reproducir o transmitir, de manera directa o indirecta, verbal, escrita o electrónicamente, la Información Confidencial a terceras personas.</li>
<li>No utilizar la Información Confidencial para fines distintos a los estrictamente necesarios para el cumplimiento de sus obligaciones contractuales.</li>
<li>Adoptar todas las medidas de seguridad necesarias para proteger la Información Confidencial.</li>
<li>Notificar inmediatamente a EL CONTRATANTE de cualquier uso no autorizado o divulgación de la Información Confidencial.</li>
</ol>

<p><strong>TERCERA.- VIGENCIA.</strong> Las obligaciones de confidencialidad permanecerán vigentes durante la relación contractual y por un período de 5 (cinco) años posteriores a su terminación. En el caso de secretos industriales, la protección y obligación de confidencialidad permanecerá vigente de manera indefinida.</p>

<p><strong>CUARTA.- EXCEPCIONES.</strong> No se considerará violación a este contrato la divulgación de información que: (i) sea del dominio público sin que medie culpa de EL PRESTADOR DE SERVICIOS; (ii) sea requerida por disposición legal o autoridad competente, en cuyo caso EL PRESTADOR DE SERVICIOS deberá notificar a EL CONTRATANTE dentro de los 2 días hábiles siguientes.</p>

<p><strong>QUINTA.- SANCIONES.</strong> El incumplimiento de las obligaciones de confidencialidad dará lugar a las acciones legales correspondientes, incluyendo las sanciones previstas en la Ley Federal de Protección a la Propiedad Industrial, así como las sanciones previstas en los artículos 210 y 211 del Código Penal Federal, además del pago de daños y perjuicios que se acrediten.</p>

<p><strong>SEXTA.- DEVOLUCIÓN DE INFORMACIÓN.</strong> A la terminación de la relación contractual, EL PRESTADOR DE SERVICIOS se obliga a devolver toda la Información Confidencial que obre en su poder, así como cualquier copia, soporte o documento que la contenga.</p>

<p><strong>SÉPTIMA.- JURISDICCIÓN.</strong> Para la interpretación y cumplimiento del presente contrato, las partes se someten a la jurisdicción de los Tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles.</p>

<br/>
<p>Leído el presente contrato y enteradas las partes de su contenido y alcances, lo firman de conformidad.</p>

<br/><br/>
<div style="display: flex; justify-content: space-between; margin-top: 40px;">
<div style="text-align: center; width: 45%;">
<p><strong>"EL CONTRATANTE"</strong></p>
<br/><br/>
<p>_______________________________</p>
<p><strong>JULIA RODRIGUEZ VARGAS</strong></p>
<p>APODERADO LEGAL</p>
<p>GSM CUSTODIAS S.A.P.I. DE C.V.</p>
</div>
<div style="text-align: center; width: 45%;">
<p><strong>"EL PRESTADOR DE SERVICIOS"</strong></p>
<br/><br/>
<p>_______________________________</p>
<p><strong>{{nombre_completo}}</strong></p>
</div>
</div>
</div>',
  variables_requeridas = ARRAY['nombre_completo', 'curp', 'direccion', 'fecha_actual'],
  version = version + 1,
  updated_at = now()
WHERE tipo_contrato = 'confidencialidad' AND activa = true;

-- Update Aviso de Privacidad template (complete version)
UPDATE plantillas_contrato 
SET contenido_html = '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6;">
<h2 style="text-align: center; font-weight: bold;">AVISO DE PRIVACIDAD INTEGRAL</h2>
<h3 style="text-align: center;">GSM CUSTODIAS S.A.P.I. DE C.V.</h3>

<p>En cumplimiento a lo dispuesto por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), su Reglamento y demás disposiciones aplicables, <strong>GSM CUSTODIAS S.A.P.I. DE C.V.</strong> (en adelante "GSM Custodias"), con domicilio en Av. Lorenzo Boturini 14 Int. 1 B, Col. Obrera, Alcaldía Cuauhtémoc, C.P. 06800, Ciudad de México, pone a su disposición el presente Aviso de Privacidad.</p>

<h3>I. IDENTIDAD DEL RESPONSABLE</h3>
<p>GSM Custodias es responsable del uso, tratamiento y protección de sus datos personales, de conformidad con la legislación vigente en materia de protección de datos personales.</p>

<h3>II. DATOS PERSONALES RECABADOS</h3>
<p>Para las finalidades señaladas en este Aviso de Privacidad, GSM Custodias podrá recabar las siguientes categorías de datos personales:</p>
<ul>
<li><strong>Datos de identificación:</strong> nombre completo, CURP, RFC, fecha y lugar de nacimiento, edad, sexo, nacionalidad, estado civil, fotografía, firma.</li>
<li><strong>Datos de contacto:</strong> domicilio, número telefónico, correo electrónico.</li>
<li><strong>Datos laborales:</strong> experiencia laboral, referencias laborales, puesto, antigüedad.</li>
<li><strong>Datos académicos:</strong> nivel de estudios, certificaciones, capacitaciones.</li>
<li><strong>Datos patrimoniales:</strong> información bancaria (CLABE, número de cuenta), datos del vehículo (marca, modelo, número de serie, placas), póliza de seguro vehicular.</li>
<li><strong>Datos de documentos oficiales:</strong> INE/IFE, licencia de conducir, comprobante de domicilio, carta de antecedentes no penales, constancia de situación fiscal.</li>
</ul>

<h3>III. DATOS PERSONALES SENSIBLES</h3>
<p>GSM Custodias podrá recabar datos personales sensibles como: resultados de pruebas toxicológicas, tipo de sangre, información de salud relevante para la prestación de servicios. Estos datos se tratarán con las medidas de seguridad reforzadas que establece la normatividad aplicable.</p>

<h3>IV. FINALIDADES DEL TRATAMIENTO</h3>
<p><strong>Finalidades primarias (necesarias):</strong></p>
<ol type="a">
<li>Evaluar su candidatura para la prestación de servicios profesionales de custodia.</li>
<li>Verificar la autenticidad de documentos e información proporcionada.</li>
<li>Elaborar y gestionar contratos de prestación de servicios.</li>
<li>Realizar pagos por servicios prestados.</li>
<li>Cumplir con obligaciones fiscales y legales.</li>
<li>Gestionar la operación de servicios de custodia y seguridad.</li>
<li>Contactarle para la asignación de servicios.</li>
</ol>
<p><strong>Finalidades secundarias (no necesarias):</strong></p>
<ol type="a">
<li>Enviar comunicaciones sobre capacitaciones y actualizaciones operativas.</li>
<li>Realizar estudios y estadísticas internas.</li>
<li>Evaluar la calidad de los servicios prestados.</li>
</ol>

<h3>V. TRANSFERENCIAS DE DATOS</h3>
<p>GSM Custodias podrá transferir sus datos personales a:</p>
<ul>
<li>Clientes de GSM Custodias, para la coordinación de servicios de custodia.</li>
<li>Autoridades competentes, cuando sea requerido por disposición legal.</li>
<li>Instituciones financieras, para la gestión de pagos.</li>
<li>Aseguradoras, en caso de siniestros durante la prestación de servicios.</li>
</ul>

<h3>VI. DERECHOS ARCO</h3>
<p>Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales (Derechos ARCO), así como a revocar su consentimiento. Para ejercer estos derechos, deberá presentar su solicitud por escrito dirigida al área de Protección de Datos de GSM Custodias, al correo electrónico: <strong>privacidad@gsmcustodias.com</strong>, incluyendo:</p>
<ol>
<li>Nombre completo y datos de contacto para comunicarle la respuesta.</li>
<li>Copia de documento oficial que acredite su identidad.</li>
<li>Descripción clara y precisa de los datos personales respecto de los cuales se busca ejercer alguno de los derechos ARCO.</li>
<li>Cualquier documento o información que facilite la localización de sus datos personales.</li>
</ol>
<p>GSM Custodias dará respuesta a su solicitud en un plazo máximo de 20 días hábiles contados a partir de la fecha de recepción.</p>

<h3>VII. MEDIOS PARA LIMITAR USO O DIVULGACIÓN</h3>
<p>Para limitar el uso o divulgación de sus datos personales, podrá enviar su solicitud al correo electrónico señalado en el apartado anterior.</p>

<h3>VIII. MODIFICACIONES AL AVISO DE PRIVACIDAD</h3>
<p>GSM Custodias se reserva el derecho de efectuar modificaciones o actualizaciones al presente Aviso de Privacidad, las cuales serán notificadas a través de los medios de comunicación establecidos en la relación contractual.</p>

<h3>IX. CONSENTIMIENTO</h3>
<p>Al firmar el presente documento, usted manifiesta haber leído y comprendido el contenido de este Aviso de Privacidad, y otorga su consentimiento expreso para el tratamiento de sus datos personales, incluyendo datos sensibles, conforme a los términos aquí descritos.</p>

<br/>
<div style="border: 1px solid #ccc; padding: 20px; margin-top: 20px;">
<p><strong>CONSENTIMIENTO Y ACEPTACIÓN</strong></p>
<p>Yo, <strong>{{nombre_completo}}</strong>, declaro haber leído y entendido el presente Aviso de Privacidad y otorgo mi consentimiento para el tratamiento de mis datos personales conforme a lo establecido en el mismo.</p>
<br/>
<p>Fecha: {{fecha_actual}}</p>
<br/><br/>
<p style="text-align: center;">_______________________________</p>
<p style="text-align: center;"><strong>{{nombre_completo}}</strong></p>
<p style="text-align: center;">Firma</p>
</div>
</div>',
  variables_requeridas = ARRAY['nombre_completo', 'fecha_actual', 'fecha_contratacion'],
  version = version + 1,
  updated_at = now()
WHERE tipo_contrato = 'aviso_privacidad' AND activa = true;

-- Insert Anexo GPS template (faithful reproduction from original document)
INSERT INTO plantillas_contrato (nombre, tipo_contrato, version, activa, contenido_html, variables_requeridas, descripcion)
VALUES (
  'Anexo GPS v1',
  'anexo_gps',
  1,
  true,
  '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6;">
<h2 style="text-align: center; font-weight: bold;">ANEXO 1</h2>

<p style="text-align: justify;">DEL CONTRATO DE PRESTACIÓN DE SERVICIOS DE SEGURIDAD PRIVADA, QUE CELEBRAN POR UNA PARTE LA EMPRESA <strong>GSM CUSTODIAS S.A.P.I. DE C.V.</strong>, REPRESENTADA EN ESTE ACTO POR EL C. <strong>JULIA RODRIGUEZ VARGAS</strong>, A QUIEN EN LO SUCESIVO Y PARA EFECTOS DEL PRESENTE INSTRUMENTO SE LE DENOMINARÁ COMO <strong>EL CONTRATANTE</strong> Y POR LA OTRA PARTE Y POR PROPIO DERECHO EL C. <strong>{{nombre_completo}}</strong> A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ COMO <strong>EL PRESTADOR DE SERVICIOS</strong>; EN SU CONJUNTO SE LES DENOMINARÁ COMO <strong>LAS PARTES</strong>, MISMAS QUE SEÑALAN LOS SIGUIENTES:</p>

<h3 style="text-align: center; letter-spacing: 8px;">A N T E C E D E N T E S</h3>

<p><strong>I.-</strong> "LAS PARTES" han celebrado un Contrato de Prestación de Servicios de Seguridad Privada (en lo sucesivo el "Contrato") en fecha {{fecha_actual}}</p>

<p><strong>II.-</strong> "LAS PARTES" reconocen plenamente el clausulado del contrato señalado en el punto anterior, ya que fue suscrito por su propia voluntad, plasmando su consentimiento en la fecha de su firma, reconociendo el alcance, términos y condiciones del mismo, así como sus derechos y obligaciones que derivaron tras su celebración.</p>

<p><strong>III.-</strong> De la citada prestación de servicios celebrada por "LAS PARTES" y, conforme a los requerimientos para cumplir con el objeto del citado contrato, "EL CONTRATANTE", pone a disposición de "EL PRESTADOR DE SERVICIOS" el objeto que se describe a continuación:</p>

<p style="text-align: center; font-weight: bold; font-size: 14px;">Equipo GPS SUNTECH</p>

<p>Por lo tanto, una vez descrito lo anterior, "LAS PARTES" se apegan a las siguientes:</p>

<h3 style="text-align: center; letter-spacing: 8px;">C L Á U S U L A S</h3>

<p><strong>PRIMERA.</strong> De conformidad con los antecedentes descritos, "EL PRESTADOR DE SERVICIOS" acepta y se obliga a pagar la cantidad de <strong>$3,582.00 (TRES MIL QUINIENTOS OCHENTA Y DOS PESOS 00/100 M.N.) IVA Incluido</strong> a "EL CONTRATANTE" por concepto de la colocación del objeto descrito en el apartado de los antecedentes del presente documento, mismo que se requiere para cumplir con sus obligaciones contraídas en el contrato de referencia.</p>

<p><strong>SEGUNDA.</strong> En relación a la cláusula anterior, "LAS PARTES" acuerdan que el pago por concepto de colocación del GPS, será liquidado a través del descuento que se realice durante las cuatro (4) primeras semanas del pago que deriva por la prestación de los servicios proporcionados.</p>

<p><strong>TERCERA.</strong> LAS PARTES ratifican los términos y condiciones establecidos en el resto del Contrato, por lo que manifiestan expresamente que el presente Anexo no constituye novación alguna, ni extingue, de ninguna forma, las obligaciones contraídas originalmente en el Contrato que se modifica. LAS PARTES acuerdan firmar el presente Anexo, en los términos y condiciones legales pactados, por lo que no se aumentan ni reducen las obligaciones y derechos a las que LAS PARTES se sometieron, salvo por lo contenido en el presente Anexo.</p>

<p><strong>CUARTA. JURISDICCIÓN Y LEY APLICABLE.</strong></p>
<p>Las Partes acuerdan que toda controversia e interpretación que se derive del presente Anexo, respecto de su operación, formalización y cumplimiento, será resuelta conforme a las leyes y Tribunales Competentes de la Ciudad de México, por lo que renuncian expresamente al fuero que pudiese corresponderles por razón de sus domicilios presentes o futuros o por cualquier otra razón.</p>

<br/>
<p>Leído el presente Anexo y enteradas LAS PARTES de su contenido y alcances, lo firman de conformidad, en la Ciudad de México, a {{fecha_actual}}</p>

<br/>
<div style="display: flex; justify-content: space-between; margin-top: 40px;">
<div style="text-align: center; width: 45%;">
<p><strong>"EL CONTRATANTE"</strong></p>
<br/><br/>
<p>_______________________________</p>
<p><strong>JULIA RODRIGUEZ VARGAS</strong></p>
<p>APODERADO LEGAL</p>
<p>GSM CUSTODIAS S.A.P.I. DE C.V.</p>
</div>
<div style="text-align: center; width: 45%;">
<p><strong>"EL PRESTADOR DE SERVICIOS"</strong></p>
<br/><br/>
<p>_______________________________</p>
<p><strong>{{nombre_completo}}</strong></p>
</div>
</div>
</div>',
  ARRAY['nombre_completo', 'fecha_actual'],
  'Anexo GPS - Equipo Suntech, pago de $3,582.00 IVA incluido en 4 semanas'
);