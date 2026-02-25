
-- Desactivar plantillas v1 existentes
UPDATE plantillas_contrato SET activa = false WHERE tipo_contrato IN ('aviso_privacidad', 'confidencialidad') AND version = 1;

-- =============================================
-- PLANTILLA 1: AVISO DE PRIVACIDAD v2
-- =============================================
INSERT INTO plantillas_contrato (nombre, tipo_contrato, version, activa, contenido_html, variables_requeridas, descripcion)
VALUES (
  'Aviso de Privacidad v2',
  'aviso_privacidad',
  2,
  true,
  '<div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">
<h1 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px;">AVISO DE PRIVACIDAD INTEGRAL</h1>

<p style="text-align: justify;">En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (en adelante "la Ley"), su Reglamento y los Lineamientos del Aviso de Privacidad, <strong>DETECTA SERVICIOS DE INTELIGENCIA S.A. DE C.V.</strong> (en adelante "DETECTA"), con domicilio en la Ciudad de México, le informa lo siguiente:</p>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 20px;">I. IDENTIDAD Y DOMICILIO DEL RESPONSABLE</h2>
<p style="text-align: justify;">DETECTA SERVICIOS DE INTELIGENCIA S.A. DE C.V., con domicilio en la Ciudad de México, es responsable del tratamiento de sus datos personales.</p>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 20px;">II. DATOS PERSONALES QUE SE RECABAN</h2>
<p style="text-align: justify;">Para las finalidades señaladas en el presente aviso de privacidad, DETECTA podrá recabar sus datos personales de distintas formas: cuando usted nos los proporciona directamente, cuando visita nuestro sitio de internet, cuando los obtengamos a través de otras fuentes permitidas por la ley. Los datos personales que recabamos son:</p>
<ul style="text-align: justify;">
<li>Datos de identificación: nombre completo, fecha de nacimiento, estado civil, nacionalidad, domicilio, fotografía, firma.</li>
<li>Datos de contacto: teléfono fijo, teléfono celular, correo electrónico.</li>
<li>Datos laborales: puesto, área, antigüedad, historial laboral, referencias laborales.</li>
<li>Datos académicos: nivel de estudios, certificaciones, constancias.</li>
<li>Datos patrimoniales y/o financieros: información bancaria (CLABE, número de cuenta, banco), ingresos.</li>
<li>Datos sobre características físicas: complexión, estatura, peso, tipo de sangre.</li>
</ul>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 20px;">III. DATOS PERSONALES SENSIBLES</h2>
<p style="text-align: justify;">DETECTA podrá recabar y tratar datos personales sensibles, tales como: resultados de exámenes médicos, antecedentes penales, resultados de pruebas psicométricas y toxicológicas. Estos datos son necesarios para cumplir con las obligaciones derivadas de la relación contractual y garantizar la seguridad de las operaciones. Le informamos que sus datos personales sensibles serán tratados bajo estrictas medidas de seguridad que garanticen su confidencialidad.</p>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 20px;">IV. FINALIDADES DEL TRATAMIENTO</h2>
<p style="text-align: justify;"><strong>Finalidades primarias (necesarias para la relación contractual):</strong></p>
<ol type="a" style="text-align: justify;">
<li>Verificar y confirmar su identidad.</li>
<li>Integrar su expediente como prestador de servicios.</li>
<li>Gestionar la relación contractual de prestación de servicios.</li>
<li>Realizar la evaluación y selección de prestadores de servicios.</li>
<li>Administrar pagos, compensaciones y facturación.</li>
<li>Dar cumplimiento a obligaciones legales, fiscales y contractuales.</li>
<li>Contactarlo para asuntos relacionados con la prestación de servicios.</li>
<li>Gestionar la asignación de servicios de custodia y seguridad.</li>
<li>Realizar verificaciones de antecedentes y referencias.</li>
<li>Llevar control de acceso a instalaciones y zonas de operación.</li>
</ol>
<p style="text-align: justify;"><strong>Finalidades secundarias (no necesarias para la relación contractual):</strong></p>
<ol type="a" style="text-align: justify;">
<li>Realizar estadísticas y análisis internos.</li>
<li>Enviar comunicados e información sobre capacitaciones.</li>
<li>Evaluar la calidad de los servicios prestados.</li>
</ol>
<p style="text-align: justify;">En caso de no estar de acuerdo con las finalidades secundarias, podrá manifestarlo al correo electrónico indicado en este aviso.</p>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 20px;">V. TRANSFERENCIAS DE DATOS</h2>
<p style="text-align: justify;">DETECTA podrá transferir sus datos personales a terceros nacionales o extranjeros en los siguientes casos:</p>
<ul style="text-align: justify;">
<li>A clientes de DETECTA, en la medida necesaria para la prestación de los servicios contratados.</li>
<li>A autoridades competentes, cuando sea requerido por disposición legal.</li>
<li>A empresas del mismo grupo corporativo, para fines administrativos internos.</li>
<li>A proveedores de servicios que actúen como encargados del tratamiento.</li>
</ul>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 20px;">VI. DERECHOS ARCO</h2>
<p style="text-align: justify;">Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada adecuadamente (Cancelación); así como oponerse al uso de sus datos personales para fines específicos (Oposición). Estos derechos se conocen como derechos ARCO.</p>
<p style="text-align: justify;">Para el ejercicio de cualquiera de los derechos ARCO, usted deberá presentar una solicitud dirigida a nuestro Departamento de Protección de Datos Personales, al correo electrónico: <strong>privacidad@detectaservicios.com</strong></p>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 20px;">VII. MECANISMOS PARA REVOCAR EL CONSENTIMIENTO</h2>
<p style="text-align: justify;">Usted puede revocar el consentimiento que, en su caso, nos haya otorgado para el tratamiento de sus datos personales. Sin embargo, es importante que tenga en cuenta que no en todos los casos podremos atender su solicitud o concluir el uso de forma inmediata, ya que es posible que por alguna obligación legal requiramos seguir tratando sus datos personales.</p>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 20px;">VIII. MODIFICACIONES AL AVISO DE PRIVACIDAD</h2>
<p style="text-align: justify;">DETECTA se reserva el derecho de efectuar en cualquier momento modificaciones o actualizaciones al presente aviso de privacidad, para la atención de novedades legislativas, políticas internas o nuevos requerimientos para la prestación de sus servicios.</p>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 20px;">IX. CONSENTIMIENTO</h2>
<p style="text-align: justify;">Al firmar el presente documento, usted manifiesta que ha leído, entendido y acepta los términos y condiciones del presente aviso de privacidad, y otorga su consentimiento para el tratamiento de sus datos personales, incluyendo los datos sensibles, conforme a lo aquí descrito.</p>

<div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px;">
<p><strong>Nombre del titular:</strong> {{nombre_completo}}</p>
<p><strong>Fecha:</strong> {{fecha_contratacion}}</p>
<div style="margin-top: 40px;">
<p>_____________________________________________</p>
<p><strong>Firma del titular</strong></p>
</div>
</div>
</div>',
  ARRAY['nombre_completo', 'fecha_contratacion'],
  'Aviso de privacidad integral DETECTA - Ley Federal de Protección de Datos Personales'
);

-- =============================================
-- PLANTILLA 2: CONVENIO DE CONFIDENCIALIDAD v2
-- =============================================
INSERT INTO plantillas_contrato (nombre, tipo_contrato, version, activa, contenido_html, variables_requeridas, descripcion)
VALUES (
  'Convenio de Confidencialidad v2',
  'confidencialidad',
  2,
  true,
  '<div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">
<h1 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 10px;">CONVENIO DE CONFIDENCIALIDAD Y NO DIVULGACIÓN</h1>
<p style="text-align: center; font-size: 12px; margin-bottom: 30px;">(Non-Disclosure Agreement)</p>

<p style="text-align: justify;">CONVENIO DE CONFIDENCIALIDAD Y NO DIVULGACIÓN que celebran, por una parte, <strong>DETECTA SERVICIOS DE INTELIGENCIA S.A. DE C.V.</strong>, representada en este acto por la <strong>C. Julia Rodríguez</strong>, en su carácter de Representante Legal (en adelante "LA PARTE REVELADORA" o "DETECTA"); y por la otra, el/la <strong>C. {{nombre_completo}}</strong>, con domicilio en <strong>{{direccion}}</strong> (en adelante "LA PARTE RECEPTORA" o "EL PRESTADOR DE SERVICIOS"), al tenor de las siguientes:</p>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 25px;">DECLARACIONES</h2>

<p style="text-align: justify;"><strong>I.</strong> Declara LA PARTE REVELADORA que:</p>
<ol type="a" style="text-align: justify;">
<li>Es una sociedad legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos, dedicada a la prestación de servicios de inteligencia, seguridad, monitoreo y custodia.</li>
<li>Cuenta con la capacidad legal necesaria para celebrar el presente convenio.</li>
<li>Es titular de información confidencial y secretos industriales relacionados con sus operaciones, clientes, rutas, protocolos de seguridad, tecnología y procesos.</li>
</ol>

<p style="text-align: justify;"><strong>II.</strong> Declara LA PARTE RECEPTORA que:</p>
<ol type="a" style="text-align: justify;">
<li>Es una persona física con plena capacidad jurídica para obligarse en los términos del presente convenio.</li>
<li>Reconoce que en virtud de la relación contractual con DETECTA, tendrá acceso a información de carácter confidencial y privilegiada.</li>
<li>Se compromete a mantener dicha información bajo estricta confidencialidad.</li>
</ol>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 25px;">CLÁUSULAS</h2>

<p style="text-align: justify;"><strong>PRIMERA. OBJETO.</strong> El presente convenio tiene por objeto establecer los términos y condiciones bajo los cuales LA PARTE RECEPTORA se obliga a proteger, mantener en confidencialidad y no divulgar la Información Confidencial a la que tenga acceso con motivo de la relación contractual con DETECTA.</p>

<p style="text-align: justify;"><strong>SEGUNDA. DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL.</strong> Para efectos del presente convenio, se entenderá por "Información Confidencial" toda aquella información, datos, documentos, materiales, procesos, métodos, técnicas, estrategias, planes, proyectos, listas, bases de datos, software, desarrollos, invenciones, know-how y cualquier otra información, ya sea oral, escrita, gráfica, electrónica o de cualquier otra forma, que sea proporcionada, revelada, divulgada, comunicada o puesta a disposición de LA PARTE RECEPTORA, incluyendo de manera enunciativa mas no limitativa:</p>
<ul style="text-align: justify;">
<li>Información sobre clientes, rutas de servicio y protocolos operativos.</li>
<li>Datos personales de clientes, custodios, operadores y personal.</li>
<li>Información financiera, comercial y estratégica de DETECTA.</li>
<li>Tecnología, sistemas, plataformas y herramientas utilizadas.</li>
<li>Procedimientos de seguridad, contingencia y emergencia.</li>
<li>Información sobre proveedores, precios y tarifas.</li>
<li>Cualquier información marcada o identificada como confidencial.</li>
</ul>

<p style="text-align: justify;"><strong>TERCERA. RECONOCIMIENTO.</strong> LA PARTE RECEPTORA reconoce que la Información Confidencial constituye un activo valioso de DETECTA y que su divulgación no autorizada causaría un daño irreparable a los intereses de la empresa y de sus clientes.</p>

<p style="text-align: justify;"><strong>CUARTA. OBLIGACIONES DE CONFIDENCIALIDAD.</strong> LA PARTE RECEPTORA se obliga a:</p>
<ol type="a" style="text-align: justify;">
<li>Mantener en estricta confidencialidad toda la Información Confidencial.</li>
<li>No divulgar, publicar, comunicar, transferir, copiar, reproducir o transmitir la Información Confidencial a terceros.</li>
<li>Utilizar la Información Confidencial únicamente para los fines directamente relacionados con la prestación de servicios a DETECTA.</li>
<li>Adoptar las medidas de seguridad necesarias para proteger la Información Confidencial contra acceso, uso, divulgación o destrucción no autorizados.</li>
<li>No fotografiar, grabar, copiar o reproducir por cualquier medio la Información Confidencial sin autorización expresa y por escrito de DETECTA.</li>
<li>Notificar de inmediato a DETECTA de cualquier uso o divulgación no autorizados de la Información Confidencial.</li>
</ol>

<p style="text-align: justify;"><strong>QUINTA. ELIMINACIÓN Y DEVOLUCIÓN.</strong> Al término de la relación contractual, o cuando DETECTA lo solicite, LA PARTE RECEPTORA deberá devolver toda la Información Confidencial que obre en su poder, incluyendo copias, reproducciones y extractos, así como eliminar de sus dispositivos toda información relacionada.</p>

<p style="text-align: justify;"><strong>SEXTA. REDES SOCIALES Y MEDIOS DIGITALES.</strong> LA PARTE RECEPTORA se obliga a no publicar, compartir o difundir en redes sociales, mensajería instantánea, foros, blogs o cualquier medio digital, información relacionada con los servicios prestados a DETECTA, sus clientes, operaciones, ubicaciones, rutas o cualquier otra información obtenida con motivo de la relación contractual.</p>

<p style="text-align: justify;"><strong>SÉPTIMA. PROPIEDAD INTELECTUAL.</strong> Toda la Información Confidencial es y seguirá siendo propiedad exclusiva de DETECTA. El presente convenio no otorga a LA PARTE RECEPTORA ningún derecho de propiedad intelectual o industrial sobre la Información Confidencial.</p>

<p style="text-align: justify;"><strong>OCTAVA. EXCLUSIVIDAD.</strong> Durante la vigencia de la relación contractual, LA PARTE RECEPTORA se compromete a no prestar servicios similares a los contratados por DETECTA a favor de empresas competidoras, sin previa autorización por escrito.</p>

<p style="text-align: justify;"><strong>NOVENA. NO COMPETENCIA.</strong> LA PARTE RECEPTORA se compromete a que durante la vigencia del contrato y por un período de 12 (doce) meses posteriores a su terminación, no contactará ni buscará contratar directamente con los clientes de DETECTA para ofrecer servicios similares.</p>

<p style="text-align: justify;"><strong>DÉCIMA. VIGENCIA.</strong> Las obligaciones de confidencialidad establecidas en el presente convenio permanecerán vigentes durante la relación contractual y por un período de 3 (tres) años posteriores a su terminación, sin perjuicio de las disposiciones legales aplicables en materia de secretos industriales.</p>

<p style="text-align: justify;"><strong>DÉCIMA PRIMERA. EXCEPCIONES.</strong> Las obligaciones de confidencialidad no aplicarán respecto de aquella información que: (a) sea o se convierta en información de dominio público sin culpa de LA PARTE RECEPTORA; (b) haya sido conocida previamente por LA PARTE RECEPTORA sin obligación de confidencialidad; (c) sea requerida por autoridad judicial o administrativa competente.</p>

<p style="text-align: justify;"><strong>DÉCIMA SEGUNDA. RESPONSABILIDAD Y SANCIONES.</strong> El incumplimiento de cualquiera de las obligaciones establecidas en el presente convenio dará lugar a la terminación inmediata de la relación contractual, sin perjuicio de las acciones legales que correspondan, incluyendo la reclamación de daños y perjuicios.</p>

<p style="text-align: justify;"><strong>DÉCIMA TERCERA. LEGISLACIÓN APLICABLE.</strong> El presente convenio se regirá e interpretará de conformidad con las leyes de los Estados Unidos Mexicanos, incluyendo la Ley de la Propiedad Industrial, la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y demás disposiciones aplicables.</p>

<p style="text-align: justify;"><strong>DÉCIMA CUARTA. JURISDICCIÓN.</strong> Para la interpretación y cumplimiento del presente convenio, las partes se someten a la jurisdicción de los Tribunales competentes de la Ciudad de México, renunciando expresamente a cualquier otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro.</p>

<p style="text-align: justify;"><strong>DÉCIMA QUINTA. ACEPTACIÓN.</strong> Leído el presente convenio y enteradas las partes de su contenido y alcance legal, lo firman en dos ejemplares en la Ciudad de México, a {{fecha_contratacion}}.</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px;">
<div style="text-align: center; width: 45%;">
<p>_____________________________________________</p>
<p><strong>LA PARTE REVELADORA</strong></p>
<p>DETECTA SERVICIOS DE INTELIGENCIA S.A. DE C.V.</p>
<p>C. Julia Rodríguez</p>
<p>Representante Legal</p>
</div>
<div style="text-align: center; width: 45%;">
<p>_____________________________________________</p>
<p><strong>LA PARTE RECEPTORA</strong></p>
<p>{{nombre_completo}}</p>
</div>
</div>
</div>',
  ARRAY['nombre_completo', 'direccion', 'fecha_contratacion'],
  'Convenio de confidencialidad y no divulgación (NDA) con DETECTA'
);

-- =============================================
-- PLANTILLA 3: CONTRATO PRESTACIÓN SERVICIOS PROPIETARIO v2
-- =============================================
INSERT INTO plantillas_contrato (nombre, tipo_contrato, version, activa, contenido_html, variables_requeridas, descripcion)
VALUES (
  'Contrato Custodio Propietario v2',
  'prestacion_servicios_propietario',
  2,
  true,
  '<div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">
<h1 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 10px;">CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES</h1>
<h2 style="text-align: center; font-size: 13px; font-weight: bold; margin-bottom: 30px;">(CUSTODIO PROPIETARIO DEL VEHÍCULO)</h2>

<p style="text-align: justify;">CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES que celebran, por una parte, <strong>DETECTA SERVICIOS DE INTELIGENCIA S.A. DE C.V.</strong>, representada en este acto por la <strong>C. Julia Rodríguez</strong>, en su carácter de Representante Legal (en adelante "EL CONTRATANTE" o "DETECTA"); y por la otra, el/la <strong>C. {{nombre_completo}}</strong>, con domicilio en <strong>{{direccion}}</strong> (en adelante "EL PRESTADOR DE SERVICIOS"), al tenor de las siguientes:</p>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 25px;">DECLARACIONES</h2>

<p style="text-align: justify;"><strong>I.</strong> Declara EL CONTRATANTE que:</p>
<ol type="a" style="text-align: justify;">
<li>Es una sociedad mercantil legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos.</li>
<li>Se dedica a la prestación de servicios de inteligencia, seguridad, monitoreo, custodia y traslado de valores.</li>
<li>Requiere contratar los servicios profesionales de EL PRESTADOR DE SERVICIOS para la realización de servicios de custodia.</li>
<li>Cuenta con los recursos necesarios para cubrir los honorarios pactados.</li>
</ol>

<p style="text-align: justify;"><strong>II.</strong> Declara EL PRESTADOR DE SERVICIOS que:</p>
<ol type="a" style="text-align: justify;">
<li>Es una persona física con capacidad legal para obligarse en los términos del presente contrato.</li>
<li>Cuenta con los conocimientos, experiencia y habilidades necesarias para prestar los servicios de custodia.</li>
<li>Es titular de la licencia de conducir número <strong>{{numero_licencia}}</strong>, expedida por <strong>{{licencia_expedida_por}}</strong>.</li>
<li>Manifiesta bajo protesta de decir verdad que no tiene impedimento legal alguno para la celebración del presente contrato.</li>
</ol>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 25px;">CLÁUSULAS</h2>

<p style="text-align: justify;"><strong>PRIMERA. OBJETO.</strong> EL PRESTADOR DE SERVICIOS se obliga a prestar a EL CONTRATANTE servicios profesionales de custodia y traslado, consistentes en el acompañamiento y protección de mercancías, valores y/o personas durante su traslado por las rutas asignadas, utilizando su vehículo propio.</p>

<p style="text-align: justify;"><strong>SEGUNDA. NATURALEZA JURÍDICA.</strong> Las partes reconocen que el presente contrato es de naturaleza civil por prestación de servicios profesionales independientes, y que no genera relación laboral alguna entre EL CONTRATANTE y EL PRESTADOR DE SERVICIOS. EL PRESTADOR DE SERVICIOS actuará con plena autonomía técnica y administrativa.</p>

<p style="text-align: justify;"><strong>TERCERA. OBLIGACIONES DEL PRESTADOR DE SERVICIOS.</strong> EL PRESTADOR se obliga a:</p>
<ol type="a" style="text-align: justify;">
<li>Prestar los servicios de custodia conforme a los protocolos y estándares establecidos por DETECTA.</li>
<li>Seguir las rutas y horarios asignados para cada servicio.</li>
<li>Mantener comunicación constante con el centro de monitoreo durante los servicios.</li>
<li>Reportar cualquier incidente, novedad o situación de riesgo de manera inmediata.</li>
<li>Portar en todo momento la identificación proporcionada por DETECTA durante los servicios.</li>
<li>Mantener su vehículo en óptimas condiciones mecánicas y de presentación.</li>
<li>Cumplir con todas las disposiciones legales aplicables, incluyendo las de tránsito.</li>
<li>Mantener vigentes su licencia de conducir, seguro vehicular y verificación vehicular.</li>
<li>Asistir a las capacitaciones que DETECTA programe.</li>
<li>Guardar absoluta confidencialidad respecto de la información a la que tenga acceso.</li>
</ol>

<p style="text-align: justify;"><strong>CUARTA. OBLIGACIONES DE EL CONTRATANTE.</strong> EL CONTRATANTE se obliga a:</p>
<ol type="a" style="text-align: justify;">
<li>Pagar los honorarios pactados conforme a las tarifas vigentes.</li>
<li>Proporcionar la información necesaria para la correcta prestación de los servicios.</li>
<li>Asignar los servicios con la debida anticipación.</li>
<li>Proporcionar las herramientas tecnológicas necesarias para el monitoreo del servicio.</li>
</ol>

<p style="text-align: justify;"><strong>QUINTA. HONORARIOS Y FORMA DE PAGO.</strong> Los honorarios se calcularán conforme a las tarifas vigentes de DETECTA por tipo de servicio y ruta. El pago se realizará de forma quincenal o semanal, según corresponda, mediante transferencia electrónica a la cuenta bancaria designada por EL PRESTADOR DE SERVICIOS.</p>

<p style="text-align: justify;"><strong>SEXTA. DATOS BANCARIOS.</strong> EL PRESTADOR DE SERVICIOS designa la siguiente cuenta para el depósito de sus honorarios:</p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
<tr><td style="padding: 5px; border: 1px solid #ccc; width: 30%;"><strong>Banco:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{banco}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Número de cuenta:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{numero_cuenta}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>CLABE interbancaria:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{clabe}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Beneficiario:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{beneficiario}}</td></tr>
</table>

<p style="text-align: justify;"><strong>SÉPTIMA. VIGENCIA.</strong> El presente contrato tendrá una vigencia indefinida, pudiendo cualquiera de las partes darlo por terminado mediante aviso por escrito con al menos 15 (quince) días naturales de anticipación.</p>

<p style="text-align: justify;"><strong>OCTAVA. DATOS DEL VEHÍCULO (PROPIEDAD DEL PRESTADOR).</strong> EL PRESTADOR DE SERVICIOS manifiesta ser propietario del vehículo que utilizará para la prestación de los servicios, con las siguientes características:</p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
<tr><td style="padding: 5px; border: 1px solid #ccc; width: 30%;"><strong>Marca:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{marca_vehiculo}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Modelo (tipo/año):</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{modelo_vehiculo}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Número de serie:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{numero_serie}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Clave vehicular:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{clave_vehicular}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Verificación vehicular:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{verificacion_vehicular}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Número de motor:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{numero_motor}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Placas:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{placas}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Color:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{color_vehiculo}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Tarjeta de circulación:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{tarjeta_circulacion}}</td></tr>
</table>

<p style="text-align: justify;"><strong>NOVENA. FACTURA DEL VEHÍCULO.</strong></p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
<tr><td style="padding: 5px; border: 1px solid #ccc; width: 30%;"><strong>Número de factura:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{numero_factura}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Fecha de factura:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{fecha_factura}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Emitida a favor de:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{factura_emitida_a}}</td></tr>
</table>

<p style="text-align: justify;"><strong>DÉCIMA. PÓLIZA DE SEGURO.</strong></p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
<tr><td style="padding: 5px; border: 1px solid #ccc; width: 30%;"><strong>Número de póliza:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{numero_poliza}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Aseguradora:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{aseguradora}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Fecha de póliza:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{fecha_poliza}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Emitida a favor de:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{poliza_emitida_a}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Tipo de póliza:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{tipo_poliza}}</td></tr>
</table>

<p style="text-align: justify;"><strong>DÉCIMA PRIMERA. RESPONSABILIDAD POR EL VEHÍCULO.</strong> EL PRESTADOR DE SERVICIOS será responsable del mantenimiento, reparaciones, seguros, tenencia, verificación y cualquier otro gasto relacionado con su vehículo. DETECTA no tendrá responsabilidad alguna sobre el vehículo propiedad de EL PRESTADOR.</p>

<p style="text-align: justify;"><strong>DÉCIMA SEGUNDA. USO DEL VEHÍCULO.</strong> EL PRESTADOR DE SERVICIOS se obliga a utilizar el vehículo descrito únicamente para los fines acordados durante la prestación de los servicios de custodia. El vehículo deberá estar en condiciones óptimas de funcionamiento.</p>

<p style="text-align: justify;"><strong>DÉCIMA TERCERA. DISPOSITIVO GPS.</strong> EL PRESTADOR DE SERVICIOS acepta que DETECTA podrá instalar un dispositivo de rastreo GPS en su vehículo para el monitoreo de los servicios de custodia. La instalación, mantenimiento y desinstalación del dispositivo serán por cuenta de DETECTA.</p>

<p style="text-align: justify;"><strong>DÉCIMA CUARTA. OBLIGACIONES FISCALES.</strong> EL PRESTADOR DE SERVICIOS será el único responsable del cumplimiento de sus obligaciones fiscales, incluyendo la emisión de los comprobantes fiscales correspondientes.</p>

<p style="text-align: justify;"><strong>DÉCIMA QUINTA. CAUSAS DE TERMINACIÓN ANTICIPADA.</strong> El presente contrato podrá darse por terminado anticipadamente por las siguientes causas:</p>
<ol type="a" style="text-align: justify;">
<li>Mutuo acuerdo de las partes.</li>
<li>Incumplimiento de cualquiera de las obligaciones establecidas.</li>
<li>Falsedad en la información proporcionada.</li>
<li>Conducta que ponga en riesgo la seguridad de las operaciones o de terceros.</li>
<li>Pérdida de vigencia de licencia de conducir, seguro vehicular o verificación.</li>
<li>Por caso fortuito o fuerza mayor que imposibilite la prestación de los servicios.</li>
</ol>

<p style="text-align: justify;"><strong>DÉCIMA SEXTA. CONFIDENCIALIDAD.</strong> Las obligaciones de confidencialidad se rigen por el Convenio de Confidencialidad y No Divulgación firmado entre las partes, el cual forma parte integral del presente contrato.</p>

<p style="text-align: justify;"><strong>DÉCIMA SÉPTIMA. DATOS PERSONALES.</strong> El tratamiento de datos personales se rige por el Aviso de Privacidad de DETECTA, el cual ha sido puesto a disposición de EL PRESTADOR DE SERVICIOS y forma parte integral del presente contrato.</p>

<p style="text-align: justify;"><strong>DÉCIMA OCTAVA. NOTIFICACIONES.</strong> Las notificaciones entre las partes se realizarán por correo electrónico a las siguientes direcciones:</p>
<ul style="text-align: justify;">
<li><strong>EL CONTRATANTE:</strong> {{email_analista}} (Attn: {{nombre_analista}})</li>
<li><strong>EL PRESTADOR DE SERVICIOS:</strong> {{email_custodio}}</li>
</ul>

<p style="text-align: justify;"><strong>DÉCIMA NOVENA. LEGISLACIÓN APLICABLE.</strong> El presente contrato se regirá por las disposiciones del Código Civil Federal y demás leyes aplicables de los Estados Unidos Mexicanos.</p>

<p style="text-align: justify;"><strong>VIGÉSIMA. JURISDICCIÓN.</strong> Para la interpretación y cumplimiento del presente contrato, las partes se someten a la jurisdicción de los tribunales competentes de la Ciudad de México.</p>

<p style="text-align: justify;">Leído que fue el presente contrato y enteradas las partes de su contenido y alcance legal, lo firman en dos ejemplares en la Ciudad de México, a <strong>{{fecha_contratacion}}</strong>.</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px;">
<div style="text-align: center; width: 45%;">
<p>_____________________________________________</p>
<p><strong>EL CONTRATANTE</strong></p>
<p>DETECTA SERVICIOS DE INTELIGENCIA S.A. DE C.V.</p>
<p>C. Julia Rodríguez</p>
<p>Representante Legal</p>
</div>
<div style="text-align: center; width: 45%;">
<p>_____________________________________________</p>
<p><strong>EL PRESTADOR DE SERVICIOS</strong></p>
<p>{{nombre_completo}}</p>
</div>
</div>
</div>',
  ARRAY['nombre_completo', 'direccion', 'fecha_contratacion', 'numero_licencia', 'licencia_expedida_por', 'marca_vehiculo', 'modelo_vehiculo', 'numero_serie', 'clave_vehicular', 'verificacion_vehicular', 'numero_motor', 'placas', 'color_vehiculo', 'tarjeta_circulacion', 'numero_factura', 'fecha_factura', 'factura_emitida_a', 'numero_poliza', 'aseguradora', 'fecha_poliza', 'poliza_emitida_a', 'tipo_poliza', 'banco', 'numero_cuenta', 'clabe', 'beneficiario', 'email_custodio', 'email_analista', 'nombre_analista'],
  'Contrato de prestación de servicios para custodio propietario de vehículo'
);

-- =============================================
-- PLANTILLA 4: CONTRATO PRESTACIÓN SERVICIOS NO PROPIETARIO v2
-- =============================================
INSERT INTO plantillas_contrato (nombre, tipo_contrato, version, activa, contenido_html, variables_requeridas, descripcion)
VALUES (
  'Contrato Custodio No Propietario v2',
  'prestacion_servicios_no_propietario',
  2,
  true,
  '<div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">
<h1 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 10px;">CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES</h1>
<h2 style="text-align: center; font-size: 13px; font-weight: bold; margin-bottom: 30px;">(CUSTODIO NO PROPIETARIO DEL VEHÍCULO)</h2>

<p style="text-align: justify;">CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES que celebran, por una parte, <strong>DETECTA SERVICIOS DE INTELIGENCIA S.A. DE C.V.</strong>, representada en este acto por la <strong>C. Julia Rodríguez</strong>, en su carácter de Representante Legal (en adelante "EL CONTRATANTE" o "DETECTA"); y por la otra, el/la <strong>C. {{nombre_completo}}</strong>, con domicilio en <strong>{{direccion}}</strong> (en adelante "EL PRESTADOR DE SERVICIOS"), al tenor de las siguientes:</p>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 25px;">DECLARACIONES</h2>

<p style="text-align: justify;"><strong>I.</strong> Declara EL CONTRATANTE que:</p>
<ol type="a" style="text-align: justify;">
<li>Es una sociedad mercantil legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos.</li>
<li>Se dedica a la prestación de servicios de inteligencia, seguridad, monitoreo, custodia y traslado de valores.</li>
<li>Requiere contratar los servicios profesionales de EL PRESTADOR DE SERVICIOS para la realización de servicios de custodia.</li>
<li>Cuenta con los recursos necesarios para cubrir los honorarios pactados.</li>
</ol>

<p style="text-align: justify;"><strong>II.</strong> Declara EL PRESTADOR DE SERVICIOS que:</p>
<ol type="a" style="text-align: justify;">
<li>Es una persona física con capacidad legal para obligarse en los términos del presente contrato.</li>
<li>Cuenta con los conocimientos, experiencia y habilidades necesarias para prestar los servicios de custodia.</li>
<li>Es titular de la licencia de conducir número <strong>{{numero_licencia}}</strong>, expedida por <strong>{{licencia_expedida_por}}</strong>.</li>
<li>Manifiesta que <strong>NO es propietario</strong> del vehículo que utilizará para la prestación de los servicios, y que cuenta con la autorización expresa del propietario para su uso.</li>
<li>Manifiesta bajo protesta de decir verdad que no tiene impedimento legal alguno para la celebración del presente contrato.</li>
</ol>

<h2 style="font-size: 13px; font-weight: bold; margin-top: 25px;">CLÁUSULAS</h2>

<p style="text-align: justify;"><strong>PRIMERA. OBJETO.</strong> EL PRESTADOR DE SERVICIOS se obliga a prestar a EL CONTRATANTE servicios profesionales de custodia y traslado, consistentes en el acompañamiento y protección de mercancías, valores y/o personas durante su traslado por las rutas asignadas.</p>

<p style="text-align: justify;"><strong>SEGUNDA. NATURALEZA JURÍDICA.</strong> Las partes reconocen que el presente contrato es de naturaleza civil por prestación de servicios profesionales independientes, y que no genera relación laboral alguna entre EL CONTRATANTE y EL PRESTADOR DE SERVICIOS.</p>

<p style="text-align: justify;"><strong>TERCERA. OBLIGACIONES DEL PRESTADOR DE SERVICIOS.</strong> EL PRESTADOR se obliga a:</p>
<ol type="a" style="text-align: justify;">
<li>Prestar los servicios de custodia conforme a los protocolos y estándares establecidos por DETECTA.</li>
<li>Seguir las rutas y horarios asignados para cada servicio.</li>
<li>Mantener comunicación constante con el centro de monitoreo durante los servicios.</li>
<li>Reportar cualquier incidente, novedad o situación de riesgo de manera inmediata.</li>
<li>Portar en todo momento la identificación proporcionada por DETECTA durante los servicios.</li>
<li>Mantener el vehículo en óptimas condiciones mecánicas y de presentación.</li>
<li>Cumplir con todas las disposiciones legales aplicables, incluyendo las de tránsito.</li>
<li>Mantener vigentes la licencia de conducir, seguro vehicular y verificación vehicular.</li>
<li>Asistir a las capacitaciones que DETECTA programe.</li>
<li>Guardar absoluta confidencialidad respecto de la información a la que tenga acceso.</li>
<li>Presentar la Carta Responsiva firmada por el propietario del vehículo.</li>
</ol>

<p style="text-align: justify;"><strong>CUARTA. OBLIGACIONES DE EL CONTRATANTE.</strong> EL CONTRATANTE se obliga a:</p>
<ol type="a" style="text-align: justify;">
<li>Pagar los honorarios pactados conforme a las tarifas vigentes.</li>
<li>Proporcionar la información necesaria para la correcta prestación de los servicios.</li>
<li>Asignar los servicios con la debida anticipación.</li>
<li>Proporcionar las herramientas tecnológicas necesarias para el monitoreo del servicio.</li>
</ol>

<p style="text-align: justify;"><strong>QUINTA. HONORARIOS Y FORMA DE PAGO.</strong> Los honorarios se calcularán conforme a las tarifas vigentes de DETECTA por tipo de servicio y ruta. El pago se realizará mediante transferencia electrónica a la cuenta bancaria designada por EL PRESTADOR DE SERVICIOS.</p>

<p style="text-align: justify;"><strong>SEXTA. DATOS BANCARIOS.</strong></p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
<tr><td style="padding: 5px; border: 1px solid #ccc; width: 30%;"><strong>Banco:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{banco}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Número de cuenta:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{numero_cuenta}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>CLABE interbancaria:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{clabe}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Beneficiario:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{beneficiario}}</td></tr>
</table>

<p style="text-align: justify;"><strong>SÉPTIMA. VIGENCIA.</strong> El presente contrato tendrá una vigencia indefinida, pudiendo cualquiera de las partes darlo por terminado mediante aviso por escrito con al menos 15 (quince) días naturales de anticipación.</p>

<p style="text-align: justify;"><strong>OCTAVA. DATOS DEL VEHÍCULO.</strong> El vehículo que utilizará EL PRESTADOR para los servicios tiene las siguientes características:</p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
<tr><td style="padding: 5px; border: 1px solid #ccc; width: 30%;"><strong>Propietario:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{nombre_propietario_vehiculo}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Marca:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{marca_vehiculo}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Modelo (tipo/año):</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{modelo_vehiculo}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Número de serie:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{numero_serie}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Clave vehicular:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{clave_vehicular}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Verificación vehicular:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{verificacion_vehicular}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Número de motor:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{numero_motor}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Placas:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{placas}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Color:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{color_vehiculo}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Tarjeta de circulación:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{tarjeta_circulacion}}</td></tr>
</table>

<p style="text-align: justify;"><strong>NOVENA. FACTURA DEL VEHÍCULO.</strong></p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
<tr><td style="padding: 5px; border: 1px solid #ccc; width: 30%;"><strong>Número de factura:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{numero_factura}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Fecha de factura:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{fecha_factura}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Emitida a favor de:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{factura_emitida_a}}</td></tr>
</table>

<p style="text-align: justify;"><strong>DÉCIMA. PÓLIZA DE SEGURO.</strong></p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
<tr><td style="padding: 5px; border: 1px solid #ccc; width: 30%;"><strong>Número de póliza:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{numero_poliza}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Aseguradora:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{aseguradora}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Fecha de póliza:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{fecha_poliza}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Emitida a favor de:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{poliza_emitida_a}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Tipo de póliza:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{tipo_poliza}}</td></tr>
</table>

<p style="text-align: justify;"><strong>DÉCIMA PRIMERA. RESPONSABILIDAD POR EL VEHÍCULO.</strong> EL PRESTADOR DE SERVICIOS será responsable del buen uso del vehículo durante la prestación de los servicios. Cualquier daño ocasionado por negligencia será responsabilidad de EL PRESTADOR. DETECTA no tendrá responsabilidad alguna sobre el vehículo.</p>

<p style="text-align: justify;"><strong>DÉCIMA SEGUNDA. AUTORIZACIÓN DEL PROPIETARIO.</strong> EL PRESTADOR DE SERVICIOS declara contar con la autorización expresa y por escrito del propietario del vehículo, <strong>C. {{nombre_propietario_vehiculo}}</strong>, para el uso del vehículo en los servicios de custodia. Dicha autorización se documenta en la Carta Responsiva que se anexa al presente contrato.</p>

<p style="text-align: justify;"><strong>DÉCIMA TERCERA. DISPOSITIVO GPS.</strong> EL PRESTADOR DE SERVICIOS acepta, con la anuencia del propietario del vehículo, que DETECTA podrá instalar un dispositivo de rastreo GPS en el vehículo para el monitoreo de los servicios de custodia.</p>

<p style="text-align: justify;"><strong>DÉCIMA CUARTA. OBLIGACIONES FISCALES.</strong> EL PRESTADOR DE SERVICIOS será el único responsable del cumplimiento de sus obligaciones fiscales.</p>

<p style="text-align: justify;"><strong>DÉCIMA QUINTA. CAUSAS DE TERMINACIÓN ANTICIPADA.</strong> El presente contrato podrá darse por terminado anticipadamente por:</p>
<ol type="a" style="text-align: justify;">
<li>Mutuo acuerdo de las partes.</li>
<li>Incumplimiento de cualquiera de las obligaciones establecidas.</li>
<li>Falsedad en la información proporcionada.</li>
<li>Revocación de la autorización del propietario del vehículo.</li>
<li>Pérdida de vigencia de licencia de conducir, seguro vehicular o verificación.</li>
<li>Por caso fortuito o fuerza mayor.</li>
</ol>

<p style="text-align: justify;"><strong>DÉCIMA SEXTA. CONFIDENCIALIDAD.</strong> Las obligaciones de confidencialidad se rigen por el Convenio de Confidencialidad firmado entre las partes.</p>

<p style="text-align: justify;"><strong>DÉCIMA SÉPTIMA. DATOS PERSONALES.</strong> El tratamiento de datos personales se rige por el Aviso de Privacidad de DETECTA.</p>

<p style="text-align: justify;"><strong>DÉCIMA OCTAVA. NOTIFICACIONES.</strong></p>
<ul style="text-align: justify;">
<li><strong>EL CONTRATANTE:</strong> {{email_analista}} (Attn: {{nombre_analista}})</li>
<li><strong>EL PRESTADOR DE SERVICIOS:</strong> {{email_custodio}}</li>
</ul>

<p style="text-align: justify;"><strong>DÉCIMA NOVENA. LEGISLACIÓN APLICABLE.</strong> El presente contrato se regirá por las disposiciones del Código Civil Federal y demás leyes aplicables.</p>

<p style="text-align: justify;"><strong>VIGÉSIMA. JURISDICCIÓN.</strong> Las partes se someten a la jurisdicción de los tribunales competentes de la Ciudad de México.</p>

<p style="text-align: justify;">Leído el presente contrato, las partes lo firman en la Ciudad de México, a <strong>{{fecha_contratacion}}</strong>.</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px;">
<div style="text-align: center; width: 45%;">
<p>_____________________________________________</p>
<p><strong>EL CONTRATANTE</strong></p>
<p>DETECTA SERVICIOS DE INTELIGENCIA S.A. DE C.V.</p>
<p>C. Julia Rodríguez</p>
<p>Representante Legal</p>
</div>
<div style="text-align: center; width: 45%;">
<p>_____________________________________________</p>
<p><strong>EL PRESTADOR DE SERVICIOS</strong></p>
<p>{{nombre_completo}}</p>
</div>
</div>

<div style="page-break-before: always; margin-top: 60px; border-top: 3px double #333; padding-top: 30px;">
<h1 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px;">CARTA RESPONSIVA</h1>
<h2 style="text-align: center; font-size: 13px; margin-bottom: 30px;">Autorización de uso de vehículo para prestación de servicios</h2>

<p style="text-align: justify;">Ciudad de México, a {{fecha_contratacion}}</p>

<p style="text-align: justify;">Por medio de la presente, el/la <strong>C. {{nombre_propietario_vehiculo}}</strong>, en mi carácter de <strong>propietario(a)</strong> del vehículo que se describe a continuación:</p>

<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
<tr><td style="padding: 5px; border: 1px solid #ccc; width: 30%;"><strong>Marca:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{marca_vehiculo}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Modelo:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{modelo_vehiculo}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Número de serie:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{numero_serie}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Placas:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{placas}}</td></tr>
<tr><td style="padding: 5px; border: 1px solid #ccc;"><strong>Color:</strong></td><td style="padding: 5px; border: 1px solid #ccc;">{{color_vehiculo}}</td></tr>
</table>

<p style="text-align: justify;">Manifiesto que <strong>AUTORIZO</strong> de manera expresa y voluntaria al <strong>C. {{nombre_completo}}</strong> para que utilice el vehículo antes descrito en la prestación de servicios de custodia para <strong>DETECTA SERVICIOS DE INTELIGENCIA S.A. DE C.V.</strong></p>

<p style="text-align: justify;">Asimismo, declaro estar de acuerdo con lo siguiente:</p>
<ol type="a" style="text-align: justify;">
<li>Autorizo la instalación de un dispositivo GPS en el vehículo para fines de monitoreo durante los servicios de custodia.</li>
<li>Acepto que el vehículo será utilizado en servicios de custodia y traslado conforme a las rutas asignadas por DETECTA.</li>
<li>Reconozco que DETECTA no asume responsabilidad alguna por daños, pérdidas o deterioro del vehículo.</li>
<li>Me comprometo a mantener vigentes los documentos del vehículo (tarjeta de circulación, verificación, seguro).</li>
<li>La presente autorización podrá ser revocada por escrito en cualquier momento, con un aviso previo de 15 días naturales.</li>
</ol>

<p style="text-align: justify;">La presente carta responsiva se firma en la Ciudad de México como parte integral del Contrato de Prestación de Servicios celebrado entre DETECTA y el prestador de servicios.</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px;">
<div style="text-align: center; width: 45%;">
<p>_____________________________________________</p>
<p><strong>PROPIETARIO DEL VEHÍCULO</strong></p>
<p>{{nombre_propietario_vehiculo}}</p>
</div>
<div style="text-align: center; width: 45%;">
<p>_____________________________________________</p>
<p><strong>PRESTADOR DE SERVICIOS</strong></p>
<p>{{nombre_completo}}</p>
</div>
</div>
</div>
</div>',
  ARRAY['nombre_completo', 'direccion', 'fecha_contratacion', 'numero_licencia', 'licencia_expedida_por', 'marca_vehiculo', 'modelo_vehiculo', 'numero_serie', 'clave_vehicular', 'verificacion_vehicular', 'numero_motor', 'placas', 'color_vehiculo', 'tarjeta_circulacion', 'numero_factura', 'fecha_factura', 'factura_emitida_a', 'numero_poliza', 'aseguradora', 'fecha_poliza', 'poliza_emitida_a', 'tipo_poliza', 'banco', 'numero_cuenta', 'clabe', 'beneficiario', 'email_custodio', 'email_analista', 'nombre_analista', 'nombre_propietario_vehiculo'],
  'Contrato de prestación de servicios para custodio NO propietario del vehículo, incluye Carta Responsiva'
);
