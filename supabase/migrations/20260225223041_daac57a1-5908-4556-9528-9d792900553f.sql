-- Update Contrato Custodio Propietario with faithful reproduction from original document
UPDATE plantillas_contrato 
SET contenido_html = '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; text-align: justify;">

<h2 style="text-align: center; font-weight: bold;">CONTRATO DE PRESTACIÓN DE SERVICIOS DE SEGURIDAD PRIVADA</h2>

<p>QUE CELEBRAN POR UNA PARTE LA EMPRESA <strong>GSM CUSTODIAS S.A.P.I. DE C.V.</strong>, REPRESENTADA EN ESTE ACTO POR EL C. <strong>JULIA RODRIGUEZ VARGAS</strong>, A QUIEN EN LO SUCESIVO Y PARA EFECTOS DEL PRESENTE INSTRUMENTO SE LE DENOMINARÁ COMO <strong>EL CONTRATANTE</strong> Y POR LA OTRA PARTE Y POR PROPIO DERECHO EL C. <strong>{{nombre_completo}}</strong>, A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ COMO <strong>EL PRESTADOR DE SERVICIOS</strong>; EN SU CONJUNTO SE LES DENOMINARÁ COMO <strong>LAS PARTES</strong>, MISMAS QUE SE SUJETAN AL TENOR DE LAS SIGUIENTES:</p>

<h3 style="text-align: center; letter-spacing: 8px;">D E C L A R A C I O N E S</h3>

<h4>I. A través de su representante legal, declara EL CONTRATANTE:</h4>

<p>A) Ser una Sociedad Mercantil legalmente constituida bajo las leyes de los Estados Unidos Mexicanos, tal y como consta en los términos de la Escritura Pública número 51,233 de fecha 10 de junio del 2015, otorgada ante la fe del Lic. Héctor Manuel Cárdenas Villareal, Notario Público número 201 del Distrito Federal, hoy Ciudad de México, instrumento que fuera inscrito en el Registro Público del Comercio de dicha ciudad el 11 de junio de 2015 bajo el Folio Mercantil Electrónico N-2019085095.</p>

<p>B) Que su representante legal cuenta con las facultades suficientes para obligar a su representada en términos de este instrumento, según se acredita en la Escritura Pública número 141,360 de fecha 23 de Febrero del 2021, pasada ante la fe de la Lic. Gerardo Correa Etchegaray, Notario Público número 89, de la Ciudad de México, mismas facultades que no le han sido revocadas, modificadas o limitadas de forma alguna.</p>

<p>C) Está inscrita en el Registro federal de Contribuyentes de la Secretaría de Hacienda y Crédito Público, bajo la clave: GCU190213TG6</p>

<p>D) Que para los efectos legales del presente contrato, señala como su domicilio el ubicado en: Av. Lorenzo Boturini 14 Int. 1 B Col. Obrera, Alcaldía Cuauhtémoc, C.P. 06800, Ciudad de México.</p>

<h4>II. Por propio derecho, declara EL PRESTADOR DE SERVICIOS:</h4>

<p>A) Es una persona física, mayor de edad y de nacionalidad mexicana, asimismo, suscribe este documento, manifestando bajo protesta de decir verdad que cuenta con las facultades y capacidad legal suficiente para obligarse en los términos del presente instrumento.</p>

<p>B) Para los efectos legales de este contrato, señala como domicilio el ubicado en: <strong>{{direccion}}</strong></p>

<p>C) Manifiesta conocer la naturaleza de la prestación del servicio a proporcionar, las normas legales que le son inherentes, los conocimientos, habilidad y documentación requerida para ejecutar el objeto de este contrato;</p>

<p>D) Cuenta con el certificado de antecedentes no penales, expedido a su favor por Órgano Administrativo Desconcentrado Prevención y Readaptación Social</p>

<p>E) Que cuenta con licencia para conducir vigente, con número: <strong>{{numero_licencia}}</strong> expedida a su favor por <strong>{{licencia_expedida_por}}</strong></p>

<p>F) Bajo protesta de decir verdad, manifiesta que es propietario del vehículo automotor que se describe a continuación:</p>

<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
<tr><td style="padding: 4px; border: 1px solid #ccc; width: 30%;"><strong>I. Marca:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{marca_vehiculo}}</td></tr>
<tr><td style="padding: 4px; border: 1px solid #ccc;"><strong>II. Modelo:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{modelo_vehiculo}}</td></tr>
<tr><td style="padding: 4px; border: 1px solid #ccc;"><strong>III. Número de Serie:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{numero_serie}}</td></tr>
<tr><td style="padding: 4px; border: 1px solid #ccc;"><strong>IV. Clave Vehicular:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{clave_vehicular}}</td></tr>
<tr><td style="padding: 4px; border: 1px solid #ccc;"><strong>V. Verificación Vehicular:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{verificacion_vehicular}}</td></tr>
<tr><td style="padding: 4px; border: 1px solid #ccc;"><strong>VI. Número de Motor:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{numero_motor}}</td></tr>
<tr><td style="padding: 4px; border: 1px solid #ccc;"><strong>VII. Placas:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{placas}}</td></tr>
<tr><td style="padding: 4px; border: 1px solid #ccc;"><strong>VIII. Color:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{color_vehiculo}}</td></tr>
<tr><td style="padding: 4px; border: 1px solid #ccc;"><strong>IX. Tarjeta de Circulación:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{tarjeta_circulacion}}</td></tr>
</table>

<p>Lo anterior, se acredita con la Factura <strong>{{numero_factura}}</strong> de fecha <strong>{{fecha_factura}}</strong>, emitida a favor de <strong>{{factura_emitida_a}}</strong>.</p>

<p>G) Cuenta con la póliza de seguro vigente número: <strong>{{numero_poliza}}</strong>, expedida por la Institución Aseguradora <strong>{{aseguradora}}</strong> en fecha <strong>{{fecha_poliza}}</strong>, a favor de: <strong>{{poliza_emitida_a}}</strong> con lo que se acredita que el vehículo se encuentra asegurado, cubriendo los siniestros que a continuación se señalan en la citada póliza: <strong>{{tipo_poliza}}</strong></p>

<p>H) Que el citado vehículo automotor, lo tiene en posesión y propiedad legal, al no existir a la fecha, proceso judicial, o bien, cualquier procedimiento administrativo que implique o comprometa la titularidad, propiedad o posesión del citado automóvil.</p>

<p>I) Que utilizará el citado vehículo para dar cumplimiento a los servicios descritos en el presente contrato de prestación de servicios.</p>

<h4>III. Declaran LAS PARTES que:</h4>

<p>A) Que el presente contrato se celebra por mutuo acuerdo de LAS PARTES, mismas que declaran la inexistencia de dolo, error, mala fe, o cualquier posible vicio en el consentimiento que expresan para la celebración del mismo.</p>

<p>B) Que se reconocen mutuamente la personalidad y capacidad, con las cuales concurren a la celebración del presente instrumento, siendo su voluntad celebrarlo de acuerdo al contenido, alcance, términos y condiciones de las siguientes:</p>

<h3 style="text-align: center; letter-spacing: 8px;">C L Á U S U L A S</h3>

<h4>PRIMERA.- OBJETO.</h4>
<p>En este acto, EL PRESTADOR DE SERVICIOS se obliga a proporcionar sus servicios a EL CONTRATANTE, siempre y cuando le sea requerido por este último, en materia de custodia de vehículos y/o personas, realizando de manera enunciativa, más no limitativa las actividades que se describen a continuación:</p>
<p>I. Asegurarse que la carga y/o mercancías asignadas a su custodia lleguen desde el punto de origen hasta su destino, según lo indique EL CONTRATANTE.</p>
<p>II. Prevenir y disuadir cualquier evento o accidente desde que la mercancía sale de su origen hasta la entrega, o bien, la llegada al destino.</p>
<p>III. Verificar y prever que los equipos de comunicación que EL PRESTADOR DE SERVICIOS utilizará para el cumplimiento de sus servicios se encuentren en óptimas condiciones de funcionamiento.</p>
<p>IV. Cuando se asigne un servicio por parte de EL CONTRATANTE, EL PRESTADOR DE SERVICIOS verificará la información de la compañía a la que prestará el servicio, el vehículo a custodiar, el origen y destino de la custodia, así como las personas de contacto que se le indiquen.</p>
<p>V. EL PRESTADOR DE SERVICIOS se obliga a desarrollar sus actividades con toda diligencia a efecto de dejar satisfecho a EL CONTRATANTE, estableciéndose como parámetros de cumplimiento y pericia los que regularmente se manejan en el mercado, obligándose a aportar toda su experiencia, capacidad y tiempo que sea necesario para dar cumplimiento a las obligaciones adquiridas en el presente instrumento contractual.</p>
<p>Adicionalmente, EL PRESTADOR DE SERVICIOS se obliga en todo momento a actuar bajo los más altos estándares y criterios de calidad, eficiencia, experiencia, confidencialidad, discreción, diligencia, profesionalismo, ética y legalidad en el desempeño de la prestación de sus servicios, por lo que de no hacerlo así, LAS PARTES acuerdan que podrá ser causal de rescisión del presente instrumento contractual.</p>

<h4>SEGUNDA.- PARTICULARIDADES DEL SERVICIO.</h4>
<p>Una vez que sea asignado un servicio, LAS PARTES acuerdan que:</p>
<p>a) EL CONTRATANTE dará a conocer a EL PRESTADOR DE SERVICIOS las reglas de seguridad, planeación de la ruta, paradas y tiempos de descanso (pernoctas), considerando que la responsabilidad del servicio es compartida entre EL PRESTADOR DE SERVICIOS y los operadores del transporte que será custodiado.</p>
<p>b) Para que EL PRESTADOR DE SERVICIOS cumpla con sus obligaciones de custodia, no deberá manejar cansado.</p>
<p>c) Para que EL PRESTADOR DE SERVICIOS cumpla con sus obligaciones de custodia, no deberá consumir de manera cotidiana, o bien, previa, durante y después del servicio correspondiente sustancias tóxicas, tales como drogas, estupefacientes, enervantes, bebidas alcohólicas y cualquier otra considerada nociva para la salud y/o ilegal.</p>
<p>d) EL PRESTADOR DE SERVICIOS está obligado a observar el comportamiento de los demás vehículos y/o personas en tránsito durante todo el recorrido de la custodia; asimismo, LAS PARTES acuerdan que durante las actividades tendientes a detectar y disuadir situaciones que pongan en peligro la seguridad de los vehículos, mercancías y/o personas bajo custodia, EL PRESTADOR DE SERVICIOS no estará obligado a confrontar de manera directa situaciones que pongan su integridad física en peligro.</p>
<p>e) EL PRESTADOR DE SERVICIOS se compromete a no exceder los límites de velocidad permitidos por la normatividad aplicable.</p>
<p>f) En caso de que EL PRESTADOR DE SERVICIOS tenga un desperfecto vehicular, o bien, cualquier emergencia, deberá estacionar el vehículo que conduce fuera de la cinta asfáltica, poniendo las luces de emergencia y abanderamientos correspondientes, según sea el caso, comunicándose inmediatamente con EL CONTRATANTE.</p>
<p>g) Cuando EL PRESTADOR DE SERVICIOS ascienda y descienda del vehículo que utilice para prestar el servicio correspondiente, deberá seguir en todo momento las normas de seguridad en operaciones que, para tales efectos EL CONTRATANTE le indique.</p>
<p>LAS PARTES acuerdan que el incumplimiento total o parcial a los incisos señalados en la presente cláusula podrá ser causal de rescisión del presente instrumento contractual.</p>

<h4>TERCERA.- MONTO Y FORMA DE PAGO.</h4>
<p>EL CONTRATANTE se obliga a pagar a EL PRESTADOR DE SERVICIOS una cantidad monetaria y equivalente a cada custodia que genere durante el transcurso de la semana y por los servicios descritos en la cláusula primera.</p>
<p>LAS PARTES acuerdan que por cada custodia realizada, EL PRESTADOR DE SERVICIOS emitirá la factura correspondiente a favor de EL CONTRATANTE y de conformidad con los requisitos y lineamientos que señala la legislación fiscal vigente.</p>
<p>EL PRESTADOR DE SERVICIOS deberá enviar a EL CONTRATANTE la factura correspondiente los días Martes de cada semana antes de las 12:00 horas. Si se llegase a enviar la factura después del horario y día antes mencionado, el pago correspondiente se generará hasta el Jueves del próximo pago.</p>
<p>El pago será liquidable cada siete (7) días, mediante transferencia bancaria a favor de EL PRESTADOR DE SERVICIOS, de conformidad con los datos bancarios que se describen a continuación:</p>
<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
<tr><td style="padding: 4px; border: 1px solid #ccc;"><strong>Nombre de la Institución Bancaria:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{banco}}</td></tr>
<tr><td style="padding: 4px; border: 1px solid #ccc;"><strong>Número de Cuenta:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{numero_cuenta}}</td></tr>
<tr><td style="padding: 4px; border: 1px solid #ccc;"><strong>CLABE Interbancaria:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{clabe}}</td></tr>
<tr><td style="padding: 4px; border: 1px solid #ccc;"><strong>Nombre del Beneficiario:</strong></td><td style="padding: 4px; border: 1px solid #ccc;">{{beneficiario}}</td></tr>
</table>

<h4>CUARTA.- VIGENCIA Y MODIFICACIONES.</h4>
<p>LAS PARTES acuerdan que la vigencia de este contrato será de cinco (5) años, comenzando a surtir efectos a partir de la fecha de celebración del presente instrumento.</p>
<p>LAS PARTES convienen en que la presente relación jurídica podrá ser renovada por períodos similares, menores, o bien, mayores a los indicados en esta cláusula, de la misma forma se podrá rescindir el presente contrato de manera anticipada por cualquiera de LAS PARTES, realizando únicamente una notificación por escrito vía electrónica, con al menos cinco días de anticipación.</p>

<h4>QUINTA.- OBLIGACIONES DEL CONTRATANTE.</h4>
<p>EL CONTRATANTE se obliga a:</p>
<p>a) Proporcionar a EL PRESTADOR DE SERVICIOS las políticas, lineamientos, procedimientos administrativos y de seguridad, así como los códigos, normas internas y externas de cumplimiento que se le señalen.</p>
<p>b) Indicar en tiempo y forma, cuáles serán y en qué consistirán los servicios que se requieren por parte de EL PRESTADOR DE SERVICIOS.</p>
<p>c) Proporcionar los recursos, documentos e información necesaria para que EL PRESTADOR DE SERVICIOS realice las actividades que se le asignen en tiempo y forma.</p>
<p>d) Pagar a EL PRESTADOR DE SERVICIOS el monto que se determine, en función de cada custodia realizada, conforme a los plazos, términos y condiciones establecidos en la cláusula tercera del presente instrumento.</p>
<p>e) Asumir y pagar los gastos extraordinarios y no previstos que se lleguen a generar por motivo de la prestación de servicios (combustible, casetas de cuota, hospedajes, alimentos y viáticos en general), siempre y cuando EL PRESTADOR DE SERVICIOS presente los comprobantes de gastos correspondientes debidamente facturados.</p>
<p>f) Apegarse en todo momento al respeto irrestricto de los derechos humanos, leyes, reglamentos y demás normatividad aplicable.</p>

<h4>SEXTA.- OBLIGACIONES DEL PRESTADOR DE SERVICIOS.</h4>
<p>EL PRESTADOR DE SERVICIOS se obliga a:</p>
<p>a) Cumplir estrictamente con las políticas, lineamientos, procedimientos administrativos y de seguridad que EL CONTRATANTE le señale.</p>
<p>b) Cumplir con las actividades, objeto del presente contrato en forma y tiempo que le encomiende EL CONTRATANTE.</p>
<p>c) Emitir la factura correspondiente a favor de EL CONTRATANTE.</p>
<p>d) Sujetarse a las evaluaciones y revisiones que realizará periódicamente EL CONTRATANTE.</p>
<p>e) Atender las solicitudes de precisión, mejora y/o modificaciones a las actividades y desempeño.</p>
<p>f) Firmar y requisitar el formato de custodias que le proporcione EL CONTRATANTE.</p>
<p>g) Acreditar los gastos extraordinarios y no previstos a través de la factura correspondiente.</p>
<p>h) Responder de manera exclusiva por el pago de derechos y/o multas que se generen por conducir de manera inadecuada.</p>
<p>i) NO divulgar ninguno de los aspectos de los negocios de EL CONTRATANTE.</p>
<p>j) Conducir el vehículo en perfecto estado físico y mecánico, realizando de manera periódica el mantenimiento correspondiente.</p>
<p>k) NO consumir sustancias tóxicas, tales como drogas, estupefacientes, enervantes, bebidas alcohólicas.</p>
<p>l) Participar en la realización de pruebas toxicológicas que le sean requeridas.</p>
<p>m) NO destinar el vehículo automotor a usos distintos, mientras se esté llevando a cabo una custodia.</p>
<p>n) Estar en cumplimiento y al corriente con los pagos referentes a la tenencia o refrendo vehicular.</p>
<p>o) Durante la ejecución de los servicios de custodia, por ningún motivo se podrá hacer acompañar por persona(s) ajena(s) al servicio.</p>
<p>p) El vehículo deberá contar con una póliza de seguro vigente.</p>
<p>q) En el supuesto de que cambie el vehículo para prestar los servicios pactados, deberá notificar de dicho cambio a EL CONTRATANTE.</p>
<p>r) Apegarse en todo momento al respeto irrestricto de los derechos humanos, leyes, reglamentos y demás normatividad aplicable.</p>
<p>En caso de no cumplir con las obligaciones descritas, LAS PARTES acuerdan que el incumplimiento total o parcial podrá ser causal de rescisión del presente instrumento contractual.</p>

<h4>SÉPTIMA.- VERIFICACIÓN DE OBLIGACIONES.</h4>
<p>EL CONTRATANTE tendrá la facultad de verificar en todo momento el exacto cumplimiento de las obligaciones que asume EL PRESTADOR DE SERVICIOS. En caso de deficiencias, EL CONTRATANTE dará aviso para que sean resueltas lo antes posible.</p>

<h4>OCTAVA.- EXCLUSIÓN DE RESPONSABILIDADES.</h4>
<p>EL CONTRATANTE queda eximido de proporcionar a EL PRESTADOR DE SERVICIOS equipo celular, laptop, tablet, automóvil, motocicleta y/o cualquier otro medio que utilice para cumplir con la prestación de los servicios pactados. EL PRESTADOR DE SERVICIOS se obliga a responder por todos los daños y perjuicios que cause en las instalaciones de cualquiera de los clientes de EL CONTRATANTE.</p>
<p>EL PRESTADOR DE SERVICIOS se obliga a realizar por su propia cuenta y riesgo los servicios referidos, liberando a EL CONTRATANTE de toda responsabilidad en caso de: robo, lesiones, muerte, secuestro, accidentes automovilísticos, daños a terceros, así como daños que deriven en la pérdida total o parcial del vehículo.</p>

<h4>NOVENA.- EXCLUSIÓN DE RELACIÓN LABORAL.</h4>
<p>LAS PARTES reconocen y aceptan que son contratantes independientes. El presente contrato no crea ninguna relación de carácter laboral, ya que es, únicamente, una relación jurídica de prestación de servicios.</p>

<h4>DÉCIMA.- CESIÓN.</h4>
<p>EL PRESTADOR DE SERVICIOS no podrá ceder o transmitir los derechos y obligaciones derivados de este contrato. EL CONTRATANTE podrá ceder total o parcialmente las obligaciones y derechos derivados de este instrumento.</p>

<h4>DÉCIMA PRIMERA.- SUBCONTRATACIÓN.</h4>
<p>EL PRESTADOR DE SERVICIOS no podrá subcontratar los servicios de un tercero. En caso de incurrir en tal supuesto, quedará por rescindida la presente relación contractual de manera automática.</p>

<h4>DÉCIMA SEGUNDA.- COMUNICACIONES.</h4>
<p>Toda notificación o comunicación deberá ser por escrito conforme a las siguientes formas: 1) Entrega personal en el domicilio proporcionado por LAS PARTES; 2) Correo electrónico con acuse de recibo.</p>
<p>EL CONTRATANTE: Atención a: GSM CUSTODIAS SAPI DE CV, correo electrónico: {{email_analista}}</p>
<p>EL PRESTADOR DE SERVICIOS: Atención a: {{nombre_completo}}, correo electrónico: {{email_custodio}}</p>

<h4>DÉCIMA TERCERA.- TERMINACIÓN ANTICIPADA.</h4>
<p>El presente contrato podrá darse por terminado de manera anticipada por cualquiera de LAS PARTES, sin la necesidad de resolución judicial, siempre y cuando se dé aviso por escrito con cinco (5) días de anticipación.</p>

<h4>DÉCIMA CUARTA.- RESCISIÓN DEL CONTRATO.</h4>
<p>EL CONTRATANTE podrá en cualquier momento rescindir el presente contrato sin necesidad de declaración judicial, por las siguientes causas:</p>
<p>1. Por el incumplimiento a lo señalado en la cláusula primera.</p>
<p>2. Por el incumplimiento a lo dispuesto por la cláusula segunda.</p>
<p>3. Por el incumplimiento a lo estipulado en la cláusula sexta.</p>
<p>4. Si EL PRESTADOR DE SERVICIOS suspende la prestación de los servicios sin causa justificable.</p>
<p>5. Si presta servicios directamente a los clientes de EL CONTRATANTE sin autorización.</p>
<p>6. Si incurre en la violación de cualquier ley o reglamento.</p>
<p>7. Si presta servicios a la competencia directa o indirecta de EL CONTRATANTE.</p>

<h4>DÉCIMA QUINTA.- CASO FORTUITO Y CAUSA DE FUERZA MAYOR.</h4>
<p>Se entiende por caso fortuito o causa de fuerza mayor, aquellos hechos o acontecimientos ajenos a la voluntad de LAS PARTES. LAS PARTES podrán suspender o dar por terminado el contrato, notificando por escrito dentro de los tres (3) días posteriores a la fecha de los hechos.</p>

<h4>DÉCIMA SEXTA.- DAÑOS Y PERJUICIOS.</h4>
<p>Los daños que se causen a EL CONTRATANTE, así como a terceros por violación de EL PRESTADOR DE SERVICIOS incluirán todos los daños y perjuicios que puedan probarse, así como todos los gastos, costos y honorarios legales que se generen.</p>

<h4>DÉCIMA SÉPTIMA.- AUSENCIA DE VICIOS.</h4>
<p>LAS PARTES manifiestan y reconocen que en el presente contrato no existe dolo, error, mala fe, lesión o vicios del consentimiento.</p>

<h4>DÉCIMA OCTAVA.- ACUERDO ENTRE LAS PARTES.</h4>
<p>El presente contrato y sus anexos contienen todos los acuerdos tomados por LAS PARTES, y sus términos y condiciones dejan sin efecto cualquier negociación anterior.</p>

<h4>DÉCIMA NOVENA.- PROPIEDAD INDUSTRIAL O INTELECTUAL.</h4>
<p>EL PRESTADOR DE SERVICIOS se obliga a no utilizar las marcas, avisos comerciales, derechos de autor y demás derechos de propiedad intelectual y/o industrial de EL CONTRATANTE, salvo en los casos estrictamente necesarios para el cumplimiento de sus obligaciones.</p>

<h4>VIGÉSIMA.- PROTECCIÓN DE DATOS PERSONALES.</h4>
<p>De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), EL CONTRATANTE permite el acceso a la base de datos como remisión de datos. EL PRESTADOR DE SERVICIOS, en su calidad de Encargado del tratamiento, únicamente podrá tratar los datos personales conforme a las instrucciones de EL CONTRATANTE.</p>

<h4>VIGÉSIMA PRIMERA.- CONFIDENCIALIDAD.</h4>
<p>EL PRESTADOR DE SERVICIOS reconoce que tendrá acceso a Información Confidencial que deberá ser guardada en estricta confidencialidad. La obligación de confidencialidad permanecerá vigente durante 5 (cinco) años posteriores a la terminación del contrato, excepto en el caso de los secretos industriales, cuya protección será indefinida.</p>

<h4>VIGÉSIMA SEGUNDA.- ENCABEZADOS.</h4>
<p>Los encabezados de las distintas cláusulas son solamente para conveniencia de referencia y no modifican, definen o limitan los términos del contrato.</p>

<h4>VIGÉSIMA TERCERA.- RECONOCIMIENTO CONTRACTUAL.</h4>
<p>El presente contrato constituye todo lo pactado entre LAS PARTES en relación con su objeto, dejando sin efectos cualquier otra negociación anterior.</p>

<h4>VIGÉSIMA CUARTA.- DISPOSICIONES GENERALES.</h4>
<p>LAS PARTES expresan bajo protesta de decir verdad que la información proporcionada es verídica y corresponde fielmente a la establecida en el presente instrumento.</p>

<h4>VIGÉSIMA QUINTA.- JURISDICCIÓN.</h4>
<p>Para la solución de cualquier controversia, LAS PARTES se someten a la jurisdicción de los Tribunales competentes con residencia en el Estado de México, renunciando a cualquier otro fuero.</p>

<br/>
<p style="text-align: center; text-transform: uppercase; font-weight: bold;">LEÍDO LO QUE FUE EL PRESENTE CONTRATO DE PRESTACIÓN DE SERVICIOS, ESTANDO LAS PARTES DEBIDAMENTE ENTERADAS DE SU CONTENIDO, TÉRMINOS, ALCANCES Y CONDICIONES LEGALES, LO FIRMAN DE ENTERA CONFORMIDAD EN EL ESTADO DE MÉXICO, EL DÍA {{fecha_actual}}</p>

<br/><br/>
<div style="display: flex; justify-content: space-between; margin-top: 40px;">
<div style="text-align: center; width: 45%;">
<p><strong>EL CONTRATANTE</strong></p>
<br/><br/>
<p>_______________________________</p>
<p><strong>JULIA RODRIGUEZ VARGAS</strong></p>
<p>APODERADO LEGAL</p>
<p>GSM CUSTODIAS S.A.P.I. DE C.V.</p>
</div>
<div style="text-align: center; width: 45%;">
<p><strong>EL PRESTADOR DE SERVICIOS</strong></p>
<br/><br/>
<p>_______________________________</p>
<p><strong>{{nombre_completo}}</strong></p>
</div>
</div>
</div>',
  version = version + 1,
  updated_at = now()
WHERE tipo_contrato = 'prestacion_servicios_propietario' AND activa = true;